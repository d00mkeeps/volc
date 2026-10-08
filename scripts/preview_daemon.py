#!/usr/bin/env python3
"""Volc Mobile Dev Preview Cloud Daemon.

Runs as a lightweight systemd cloud service on Cano.
Provides an HTTP API for on-demand lifecycle management of:
- Metro Bundler (Expo Dev Client)
- Ephemeral Cloudflare Quick Tunnel (zero-token HTTPS)
- Interactive Telegram cards via Observer Operator
"""

from __future__ import annotations
import os
import re
import sys
import time
import json
import signal
import logging
import urllib.parse
import urllib.request
import subprocess
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread, Lock, Timer
from datetime import datetime, timezone, timedelta

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("volc.preview_daemon")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
HOST_PORT = 8007
METRO_PORT = 8081
DEV_BACKEND_URL = "http://127.0.0.1:8102/health"

class PreviewManager:
    def __init__(self):
        self.lock = Lock()
        self.is_running = False
        self.cf_proc: subprocess.Popen | None = None
        self.metro_proc: subprocess.Popen | None = None
        self.cf_url: str | None = None
        self.deep_link: str | None = None
        self.trampoline_url: str | None = None
        self.started_at: datetime | None = None
        self.expires_at: datetime | None = None
        self.watchdog_timer: Timer | None = None

    def _cleanup_processes(self):
        """Forcefully clean up Metro, Cloudflare, and port 8081."""
        if self.metro_proc:
            try:
                self.metro_proc.terminate()
                self.metro_proc.wait(timeout=3)
            except Exception:
                try:
                    self.metro_proc.kill()
                except Exception:
                    pass
            self.metro_proc = None

        if self.cf_proc:
            try:
                self.cf_proc.terminate()
                self.cf_proc.wait(timeout=3)
            except Exception:
                try:
                    self.cf_proc.kill()
                except Exception:
                    pass
            self.cf_proc = None

        try:
            subprocess.run(["fuser", "-k", f"{METRO_PORT}/tcp"], capture_output=True, timeout=5)
            subprocess.run(["pkill", "-f", f"cloudflared.*{METRO_PORT}"], capture_output=True, timeout=5)
        except Exception:
            pass

    def _check_dev_backend(self):
        """Verify volc-backend-dev is healthy on port 8102."""
        try:
            req = urllib.request.Request(DEV_BACKEND_URL, headers={"User-Agent": "PreviewDaemon/1.0"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    log.info("Volc dev backend is healthy on port 8102.")
                    return True
        except Exception as e:
            log.warning("Volc dev backend unreachable (%s). Attempting docker compose startup...", e)
            try:
                compose_file = PROJECT_ROOT / "docker-compose.dev.yml"
                if compose_file.exists():
                    subprocess.run(
                        ["docker", "compose", "-f", str(compose_file), "up", "-d"],
                        cwd=str(PROJECT_ROOT),
                        capture_output=True,
                        timeout=15,
                    )
                    time.sleep(3)
            except Exception as ex:
                log.error("Failed to start volc-backend-dev: %s", ex)
        return False

    def start(self, timeout_minutes: int = 30) -> dict:
        with self.lock:
            if self.is_running and self.deep_link:
                return {
                    "ok": True,
                    "status": "already_running",
                    "tunnel_url": self.cf_url,
                    "deep_link": self.deep_link,
                    "trampoline_url": self.trampoline_url,
                    "expires_at": self.expires_at.isoformat() if self.expires_at else None,
                }

            log.info("Starting Volc Mobile Dev Preview session (timeout=%dm)...", timeout_minutes)
            self._cleanup_processes()
            self._check_dev_backend()

            # 1. Start Cloudflare Quick Tunnel
            cf_cmd = ["cloudflared", "tunnel", "--url", f"http://127.0.0.1:{METRO_PORT}"]
            log.info("Spawning Cloudflare tunnel: %s", " ".join(cf_cmd))
            self.cf_proc = subprocess.Popen(
                cf_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            # Wait for tunnel URL
            cf_url = None
            start_time = time.time()
            while time.time() - start_time < 20:
                line = self.cf_proc.stdout.readline()
                if not line:
                    if self.cf_proc.poll() is not None:
                        break
                    time.sleep(0.2)
                    continue
                match = re.search(r"https://[a-zA-Z0-9.-]+\.trycloudflare\.com", line)
                if match:
                    cf_url = match.group(0)
                    break

            if not cf_url:
                log.error("Failed to extract Cloudflare tunnel URL!")
                self._cleanup_processes()
                return {"ok": False, "error": "Failed to establish Cloudflare tunnel."}

            log.info("Cloudflare tunnel established: %s", cf_url)
            self.cf_url = cf_url

            # 2. Start Metro with proxy env
            metro_env = os.environ.copy()
            metro_env["EXPO_PACKAGER_PROXY_URL"] = cf_url

            metro_cmd = ["npx", "expo", "start", "--dev-client", "--localhost"]
            log.info("Spawning Metro Bundler with EXPO_PACKAGER_PROXY_URL=%s", cf_url)
            self.metro_proc = subprocess.Popen(
                metro_cmd,
                cwd=str(PROJECT_ROOT),
                env=metro_env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

            # Construct URLs
            encoded_cf = urllib.parse.quote(cf_url, safe="")
            self.deep_link = f"exp+volc://expo-development-client/?url={encoded_cf}"
            self.trampoline_url = f"https://volc.mileshillary.com/preview?url={encoded_cf}"

            now = datetime.now(timezone.utc)
            self.started_at = now
            self.expires_at = now + timedelta(minutes=timeout_minutes)
            self.is_running = True

            # Schedule Watchdog
            if self.watchdog_timer:
                self.watchdog_timer.cancel()
            self.watchdog_timer = Timer(timeout_minutes * 60, self._auto_expire)
            self.watchdog_timer.daemon = True
            self.watchdog_timer.start()

            return {
                "ok": True,
                "status": "started",
                "tunnel_url": self.cf_url,
                "deep_link": self.deep_link,
                "trampoline_url": self.trampoline_url,
                "expires_at": self.expires_at.isoformat(),
            }

    def _auto_expire(self):
        log.info("Watchdog timer expired. Stopping preview session.")
        self.stop(reason="Auto-closed after inactivity period.")

    def stop(self, reason: str = "Stopped via Preview Daemon.") -> dict:
        with self.lock:
            if not self.is_running:
                return {"ok": True, "status": "already_stopped"}

            log.info("Stopping preview session: %s", reason)
            if self.watchdog_timer:
                self.watchdog_timer.cancel()
                self.watchdog_timer = None

            self._cleanup_processes()

            self.is_running = False
            self.cf_url = None
            self.deep_link = None
            self.trampoline_url = None
            self.started_at = None
            self.expires_at = None

            return {"ok": True, "status": "stopped", "reason": reason}

    def status(self) -> dict:
        with self.lock:
            # Check if processes are actually alive
            if self.is_running:
                if self.metro_proc and self.metro_proc.poll() is not None:
                    log.warning("Metro process unexpectedly exited with code %s", self.metro_proc.returncode)
                    self.is_running = False
                elif self.cf_proc and self.cf_proc.poll() is not None:
                    log.warning("Cloudflare tunnel process unexpectedly exited with code %s", self.cf_proc.returncode)
                    self.is_running = False

            remaining_sec = 0
            if self.is_running and self.expires_at:
                remaining_sec = max(0, int((self.expires_at - datetime.now(timezone.utc)).total_seconds()))

            return {
                "active": self.is_running,
                "project": "volc",
                "tunnel_url": self.cf_url,
                "deep_link": self.deep_link,
                "trampoline_url": self.trampoline_url,
                "started_at": self.started_at.isoformat() if self.started_at else None,
                "expires_at": self.expires_at.isoformat() if self.expires_at else None,
                "remaining_seconds": remaining_sec,
            }


manager = PreviewManager()

class DaemonRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ("/status", "/preview/status", "/preview/active"):
            self._send_json(manager.status())
        elif parsed.path in ("/health", "/"):
            self._send_json({"ok": True, "service": "volc-preview-daemon"})
        else:
            self._send_json({"error": "Not Found"}, status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            body = json.loads(post_body.decode("utf-8")) if post_body else {}
        except Exception:
            body = {}

        if parsed.path in ("/start", "/preview/start"):
            timeout = int(body.get("timeout_minutes", 30))
            res = manager.start(timeout_minutes=timeout)
            status_code = 200 if res.get("ok") else 500
            self._send_json(res, status=status_code)
        elif parsed.path in ("/stop", "/preview/stop"):
            reason = body.get("reason", "Stopped via API request.")
            res = manager.stop(reason=reason)
            self._send_json(res)
        else:
            self._send_json({"error": "Not Found"}, status=404)

    def log_message(self, format, *args):
        # Redirect request logs to standard logging
        log.debug("%s - - [%s] %s", self.address_string(), self.log_date_time_string(), format % args)


def run_daemon():
    server = HTTPServer(("0.0.0.0", HOST_PORT), DaemonRequestHandler)
    log.info("Volc Mobile Preview Cloud Daemon listening on http://0.0.0.0:%d", HOST_PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        log.info("Shutting down Preview Daemon...")
        manager.stop(reason="Preview daemon terminated.")
        server.server_close()


if __name__ == "__main__":
    run_daemon()
