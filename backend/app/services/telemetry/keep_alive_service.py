"""Supabase Keep-Alive & Admin Telemetry Service for Volc.

Maintains active traffic to prevent Supabase from pausing due to free-tier inactivity,
and tracks database health, round-trip latency, and connection state.
"""

from __future__ import annotations
import os
import sys
import time
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import urllib.request
import json

from app.core.supabase.client import supabase_factory

logger = logging.getLogger("volc.telemetry.keepalive")


class SupabaseKeepAliveService:
    def __init__(self):
        self.total_pings: int = 0
        self.successful_pings: int = 0
        self.failed_pings: int = 0
        self.consecutive_failures: int = 0
        self.last_latency_ms: Optional[int] = None
        self.last_ping_utc: Optional[str] = None
        self.last_status: str = "initialized"
        self.last_error_message: Optional[str] = None
        self.is_running: bool = False

    def _get_inbox_pusher(self):
        try:
            sys.path.insert(0, "/home/ubuntu/dev/observer/operator")
            from inbox import push_event
            return push_event
        except Exception:
            return None

    async def ping(self) -> Dict[str, Any]:
        """Execute a read/write keep-alive heartbeat against Supabase."""
        self.total_pings += 1
        t0 = time.monotonic()
        url = supabase_factory.url
        anon_key = supabase_factory.anon_key

        if not url or not anon_key:
            self.last_status = "unconfigured"
            self.last_error_message = "Supabase URL or Key missing in environment."
            return self.get_summary()

        read_ok = False
        write_ok = False
        details = {}

        try:
            # 1. READ PING: REST API call with anon key
            read_start = time.monotonic()
            req = urllib.request.Request(
                f"{url.rstrip('/')}/rest/v1/?apikey={anon_key}",
                headers={
                    "apikey": anon_key,
                    "Authorization": f"Bearer {anon_key}",
                    "User-Agent": "VolcKeepAlive/1.0",
                },
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                if resp.status in (200, 204):
                    read_ok = True
                    details["read_ms"] = int((time.monotonic() - read_start) * 1000)
        except Exception as e:
            logger.warning("Supabase Keep-Alive read probe failed: %s", e)
            details["read_error"] = str(e)

        # 2. WRITE PING: Attempt heartbeat telemetry row if client available
        try:
            write_start = time.monotonic()
            client = supabase_factory.get_user_client("") if hasattr(supabase_factory, "get_user_client") else None
            if client:
                payload = {
                    "service": "volc-backend",
                    "ping_type": "keep_alive",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "metadata": {"version": "2.0.0"},
                }
                # Threaded call to avoid blocking the event loop
                res = await asyncio.to_thread(
                    lambda: client.table("telemetry_pings").insert(payload).execute()
                )
                if res and getattr(res, "data", None):
                    write_ok = True
                    details["write_ms"] = int((time.monotonic() - write_start) * 1000)
        except Exception as e:
            # Tables or RLS may not be configured yet; read is sufficient for keep-alive
            details["write_note"] = f"Write optional (table or RLS): {e}"

        total_latency_ms = int((time.monotonic() - t0) * 1000)
        self.last_latency_ms = total_latency_ms
        self.last_ping_utc = datetime.now(timezone.utc).isoformat()

        if read_ok:
            self.successful_pings += 1
            self.consecutive_failures = 0
            self.last_status = "healthy"
            self.last_error_message = None
            logger.info(
                "🟢 [Supabase Keep-Alive] Success (%d ms) | Total: %d, Success: %d",
                total_latency_ms,
                self.total_pings,
                self.successful_pings,
            )
        else:
            self.failed_pings += 1
            self.consecutive_failures += 1
            self.last_status = "failing"
            self.last_error_message = details.get("read_error", "Unknown network failure")
            logger.error(
                "🔴 [Supabase Keep-Alive] Failed! (%s) | Consecutive: %d",
                self.last_error_message,
                self.consecutive_failures,
            )

            # Alert Agent Inbox if 2+ consecutive failures occur
            if self.consecutive_failures >= 2:
                pusher = self._get_inbox_pusher()
                if pusher:
                    pusher(
                        project="volc",
                        title=f"Supabase Keep-Alive Failed ({self.consecutive_failures}x)",
                        message=f"Supabase endpoint {url} unreachable: {self.last_error_message}",
                        source="keepalive",
                        level="fatal",
                    )

        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        """Return diagnostic metrics for admin dashboard."""
        return {
            "status": self.last_status,
            "supabase_url": supabase_factory.url,
            "last_ping_utc": self.last_ping_utc,
            "last_latency_ms": self.last_latency_ms,
            "total_pings": self.total_pings,
            "successful_pings": self.successful_pings,
            "failed_pings": self.failed_pings,
            "consecutive_failures": self.consecutive_failures,
            "last_error": self.last_error_message,
        }


keep_alive_service = SupabaseKeepAliveService()
