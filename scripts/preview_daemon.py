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

DEFAULT_TIMEOUT_MINUTES = 60
DEFAULT_PREVIEW_URL = os.getenv("VOLC_PREVIEW_URL", "https://volc-metro.mileshillary.com")


def push_agent_inbox_error(
    title: str,
    message: str = "",
    source: str = "metro",
    level: str = "error",
    stack: str | None = None,
    metadata: dict | None = None,
):
    """Forward an error event to the Cano Agent Inbox."""
    try:
        operator_path = "/home/ubuntu/dev/observer/operator"
        if operator_path not in sys.path:
            sys.path.insert(0, operator_path)
        from inbox import push_event
        return push_event(
            project="volc",
            title=title,
            message=message,
            source=source,
            level=level,
            stack=stack,
            metadata=metadata,
        )
    except Exception as e:
        log.warning("Failed to push event to Agent Inbox: %s", e)
        return None


class PreviewManager:
    def __init__(self):
        self.lock = Lock()
        self.is_running = False
        self.cf_proc: subprocess.Popen | None = None
        self.metro_proc: subprocess.Popen | None = None
        self.metro_log_thread: Thread | None = None
        self.cf_url: str | None = None
        self.deep_link: str | None = None
        self.trampoline_url: str | None = None
        self.started_at: datetime | None = None
        self.expires_at: datetime | None = None
        self.timeout_minutes: int = DEFAULT_TIMEOUT_MINUTES
        self.last_activity: float = 0.0
        self.watchdog_thread: Thread | None = None
        self.stop_watchdog_flag = False

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

    def _has_network_activity(self) -> bool:
        """Check if there are active TCP connections to Metro port 8081."""
        try:
            res = subprocess.run(
                ["ss", "-Htan", f"sport = :{METRO_PORT}"],
                capture_output=True,
                text=True,
                timeout=2,
            )
            for line in res.stdout.strip().splitlines():
                if "ESTAB" in line:
                    return True
        except Exception:
            pass
        return False

    def touch_activity(self):
        """Reset the inactivity timer to extend preview session."""
        with self.lock:
            if self.is_running:
                self.last_activity = time.time()
                self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.timeout_minutes)
                log.info("Preview activity touched. New expiration: %s", self.expires_at.isoformat())

    def _watchdog_loop(self):
        """Monitors session for inactivity and spins down after timeout_minutes of idle time."""
        log.info("Watchdog supervisor running (inactivity timeout=%dm)...", self.timeout_minutes)
        while not self.stop_watchdog_flag:
            time.sleep(15)
            if self.stop_watchdog_flag:
                break

            should_expire = False
            with self.lock:
                if not self.is_running:
                    break

                # If active connections exist on port 8081, keep session alive
                if self._has_network_activity():
                    self.last_activity = time.time()
                    self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.timeout_minutes)

                idle_seconds = time.time() - self.last_activity
                if idle_seconds >= self.timeout_minutes * 60:
                    should_expire = True

            if should_expire:
                log.info("Inactivity timeout reached (%dm idle). Automatically spinning down preview.", self.timeout_minutes)
                self.stop(reason=f"Auto-closed after {self.timeout_minutes} minutes of inactivity.")
                break

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

    def start(self, timeout_minutes: int = DEFAULT_TIMEOUT_MINUTES) -> dict:
        with self.lock:
            if self.is_running and self.deep_link:
                # Update timeout if specified
                self.timeout_minutes = timeout_minutes
                self.last_activity = time.time()
                self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=timeout_minutes)
                return {
                    "ok": True,
                    "status": "already_running",
                    "tunnel_url": self.cf_url,
                    "deep_link": self.deep_link,
                    "trampoline_url": self.trampoline_url,
                    "expires_at": self.expires_at.isoformat() if self.expires_at else None,
                }

            log.info("Starting Volc Mobile Dev Preview session (inactivity timeout=%dm)...", timeout_minutes)
            self._cleanup_processes()
            self._check_dev_backend()

            # 1. Determine Cloudflare Tunnel URL
            cf_url = None
            if DEFAULT_PREVIEW_URL:
                cf_url = DEFAULT_PREVIEW_URL
                log.info("Using persistent Zero Trust preview URL: %s", cf_url)
                self.cf_proc = None
            else:
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
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )

            # Start real-time Metro log watcher & Agent Inbox forwarder
            self.metro_log_thread = Thread(
                target=self._metro_log_watcher,
                args=(self.metro_proc,),
                daemon=True,
            )
            self.metro_log_thread.start()

            # Construct URLs
            encoded_cf = urllib.parse.quote(cf_url, safe="")
            self.deep_link = f"exp+volc://expo-development-client/?url={encoded_cf}"
            self.trampoline_url = f"https://volc.mileshillary.com/preview?url={encoded_cf}"

            now = datetime.now(timezone.utc)
            self.started_at = now
            self.timeout_minutes = timeout_minutes
            self.last_activity = time.time()
            self.expires_at = now + timedelta(minutes=timeout_minutes)
            self.is_running = True
            self.stop_watchdog_flag = False

            # Spawn watchdog supervisor thread
            self.watchdog_thread = Thread(target=self._watchdog_loop, daemon=True)
            self.watchdog_thread.start()

            return {
                "ok": True,
                "status": "started",
                "tunnel_url": self.cf_url,
                "deep_link": self.deep_link,
                "trampoline_url": self.trampoline_url,
                "expires_at": self.expires_at.isoformat(),
            }

    def _flush_error(self, title: str, lines: list[str]):
        msg = "\n".join(lines).strip()
        if not title and lines:
            title = lines[0][:120]
        title = title or "Metro Runtime Error"
        log.warning("🚨 [Metro Error Captured] %s", title)
        push_agent_inbox_error(
            title=title,
            message=msg,
            source="metro",
            level="error",
        )

    def _metro_log_watcher(self, proc: subprocess.Popen):
        log.info("Metro log watcher active; streaming output to metro.log & Agent Inbox")
        metro_log_path = PROJECT_ROOT / "metro.log"
        error_buffer = []
        in_error_block = False
        error_title = ""

        error_regex = re.compile(
            r"(SyntaxError:|TypeError:|ReferenceError:|Unable to resolve module|Failed building JavaScript bundle|Invariant Violation:|\[ERROR\]|TransformError|Error:)",
            re.I,
        )

        try:
            with open(metro_log_path, "a", encoding="utf-8") as lf:
                lf.write(f"\n--- Preview Session Started {datetime.now(timezone.utc).isoformat()} ---\n")
                while self.is_running and proc.poll() is None:
                    line = proc.stdout.readline()
                    if not line:
                        time.sleep(0.05)
                        continue

                    lf.write(line)
                    lf.flush()
                    self.touch_activity()

                    clean = line.strip()
                    if not clean:
                        if in_error_block and error_buffer:
                            self._flush_error(error_title, error_buffer)
                            in_error_block = False
                            error_buffer = []
                        continue

                    # Ignore benign debug notices that contain [error] like useShareIntent
                    if "useShareIntent" in clean:
                        continue

                    # Check if line initiates an error block
                    if error_regex.search(clean):
                        if in_error_block and error_buffer:
                            self._flush_error(error_title, error_buffer)
                        in_error_block = True
                        error_title = clean[:120]
                        error_buffer = [clean]
                    elif in_error_block:
                        error_buffer.append(clean)
                        if len(error_buffer) >= 20:
                            self._flush_error(error_title, error_buffer)
                            in_error_block = False
                            error_buffer = []

                if in_error_block and error_buffer:
                    self._flush_error(error_title, error_buffer)
        except Exception as e:
            log.error("Exception in _metro_log_watcher: %s", e)

    def stop(self, reason: str = "Stopped via Preview Daemon.") -> dict:
        with self.lock:
            if not self.is_running:
                return {"ok": True, "status": "already_stopped"}

            log.info("Stopping preview session: %s", reason)
            self.stop_watchdog_flag = True
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
                "timeout_minutes": self.timeout_minutes,
            }


manager = PreviewManager()

class DaemonRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ("/status", "/preview/status", "/preview/active"):
            self._send_json(manager.status())
        elif parsed.path in ("/touch", "/activity", "/heartbeat", "/preview/touch"):
            manager.touch_activity()
            self._send_json({"ok": True, "status": "touched", **manager.status()})
        elif parsed.path in ("/logs", "/preview/logs"):
            metro_log = PROJECT_ROOT / "metro.log"
            lines = []
            if metro_log.exists():
                try:
                    with open(metro_log, "r", encoding="utf-8", errors="replace") as f:
                        lines = [l.rstrip() for l in f.readlines()[-150:]]
                except Exception:
                    pass
            self._send_json({"ok": True, "lines": lines})
        elif parsed.path in ("/inbox", "/inbox/events"):
            try:
                operator_path = "/home/ubuntu/dev/observer/operator"
                if operator_path not in sys.path:
                    sys.path.insert(0, operator_path)
                from inbox import list_events
                self._send_json({"ok": True, "events": list_events(unread_only=True, project="volc")})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, status=500)
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
            timeout = int(body.get("timeout_minutes", DEFAULT_TIMEOUT_MINUTES))
            res = manager.start(timeout_minutes=timeout)
            status_code = 200 if res.get("ok") else 500
            self._send_json(res, status=status_code)
        elif parsed.path in ("/touch", "/activity", "/heartbeat", "/preview/touch"):
            manager.touch_activity()
            self._send_json({"ok": True, "status": "touched", **manager.status()})
        elif parsed.path in ("/stop", "/preview/stop"):
            reason = body.get("reason", "Stopped via API request.")
            res = manager.stop(reason=reason)
            self._send_json(res)
        elif parsed.path in ("/client-error", "/preview/client-error", "/inbox/events"):
            title = body.get("title") or body.get("message") or "Client Runtime Error"
            res = push_agent_inbox_error(
                title=title,
                message=body.get("message", title),
                source=body.get("source", "mobile-client"),
                level=body.get("level", "error"),
                stack=body.get("stack"),
                metadata=body.get("metadata", {}),
            )
            self._send_json(res or {"ok": True})
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
