import os
import logging
from datetime import datetime, timedelta, timezone
from collections import defaultdict, Counter
from typing import Dict, Any, Optional

from app.core.supabase.client import get_admin_client

logger = logging.getLogger(__name__)


class AnalyticsAggregator:
    """
    Background analytics service that queries Supabase via the admin service role key.
    Maintains an in-memory cached snapshot updated hourly.
    """

    def __init__(self):
        self._cached_metrics: Optional[Dict[str, Any]] = None
        self._last_refresh_time: Optional[datetime] = None
        self._cache_ttl_seconds: int = 3600  # 1 hour

    async def get_metrics(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Return the cached metrics. If expired or force_refresh is True, recalculate.
        """
        now = datetime.now(timezone.utc)
        if (
            force_refresh
            or self._cached_metrics is None
            or self._last_refresh_time is None
            or (now - self._last_refresh_time).total_seconds() > self._cache_ttl_seconds
        ):
            await self.refresh_metrics()

        return self._cached_metrics or self._get_fallback_metrics(status="empty")

    async def refresh_metrics(self) -> Dict[str, Any]:
        """
        Query Supabase tables with admin client and compute 3-tab metrics.
        Gracefully falls back if Supabase is unreachable or paused.
        """
        logger.info("Refreshing hourly admin analytics metrics...")
        now = datetime.now(timezone.utc)

        try:
            admin_client = get_admin_client()

            # 1. Fetch User Profiles
            try:
                profiles_res = (
                    admin_client.table("user_profiles")
                    .select("id, created_at, experience_level, goal")
                    .execute()
                )
                profiles = profiles_res.data or []
            except Exception as e:
                logger.warning(f"Could not fetch user_profiles: {e}")
                profiles = []

            # 2. Fetch Workouts
            try:
                workouts_res = (
                    admin_client.table("workouts")
                    .select("id, user_id, created_at, name, status")
                    .order("created_at", desc=True)
                    .limit(2000)
                    .execute()
                )
                workouts = workouts_res.data or []
            except Exception as e:
                logger.warning(f"Could not fetch workouts: {e}")
                workouts = []

            # 3. Fetch Workout Exercises for Muscle Group Analysis
            try:
                exercises_res = (
                    admin_client.table("workout_exercises")
                    .select("id, name, order_index")
                    .limit(3000)
                    .execute()
                )
                exercises = exercises_res.data or []
            except Exception as e:
                logger.warning(f"Could not fetch workout_exercises: {e}")
                exercises = []

            # 4. Fetch Usage Logs (LLM Telemetry)
            try:
                logs_res = (
                    admin_client.table("usage_logs")
                    .select("*")
                    .order("timestamp", desc=True)
                    .limit(2000)
                    .execute()
                )
                logs = logs_res.data or []
            except Exception as e:
                logger.warning(f"Could not fetch usage_logs: {e}")
                logs = []

            # 5. Fetch Email Signups (Landing Page Waitlist)
            try:
                signups_res = (
                    admin_client.table("email_signups")
                    .select("id, email, created_at, source")
                    .order("created_at", desc=True)
                    .limit(1000)
                    .execute()
                )
                email_signups = signups_res.data or []
            except Exception as e:
                logger.warning(f"Could not fetch email_signups: {e}")
                email_signups = []

            # If all tables returned empty (e.g. database paused/unreachable), generate baseline data
            if not profiles and not workouts and not logs and not email_signups:
                logger.warning("Supabase returned empty data or connection failed. Using demo baseline metrics.")
                self._cached_metrics = self._get_fallback_metrics(status="paused_or_offline")
                self._last_refresh_time = now
                return self._cached_metrics

            # Compute Tab 1: Workouts & Product Metrics
            workouts_data = self._compute_workout_metrics(workouts, exercises, now)

            # Compute Tab 2: User Growth & Waitlist Metrics
            growth_data = self._compute_growth_metrics(profiles, email_signups, now)

            # Compute Tab 3: AI Coach Diagnostics
            ai_data = self._compute_ai_metrics(logs, now)

            # Overview KPIs
            overview = {
                "total_users": len(profiles),
                "total_workouts": len(workouts),
                "total_ai_queries": len(logs),
                "total_waitlist_leads": len(email_signups),
                "avg_ai_latency_ms": ai_data["kpis"]["avg_latency"],
                "last_updated": now.isoformat(),
                "db_status": "live",
            }

            self._cached_metrics = {
                "overview": overview,
                "workouts": workouts_data,
                "growth": growth_data,
                "ai": ai_data,
            }
            self._last_refresh_time = now
            logger.info("Admin analytics refreshed successfully.")
            return self._cached_metrics

        except Exception as e:
            logger.error(f"Error refreshing admin analytics: {e}", exc_info=True)
            self._cached_metrics = self._get_fallback_metrics(status="error")
            self._last_refresh_time = now
            return self._cached_metrics

    def _compute_workout_metrics(self, workouts: list, exercises: list, now: datetime) -> Dict[str, Any]:
        """Compute workout time series and exercise distributions"""
        # Hourly activity (last 24 hours)
        hourly_counts = defaultdict(int)
        cutoff_24h = now - timedelta(hours=24)

        # Daily activity (last 30 days)
        daily_counts = defaultdict(int)
        cutoff_30d = now - timedelta(days=30)

        for w in workouts:
            ts_str = w.get("created_at")
            if not ts_str:
                continue
            try:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if dt >= cutoff_24h:
                    hour_key = dt.strftime("%H:00")
                    hourly_counts[hour_key] += 1
                if dt >= cutoff_30d:
                    day_key = dt.strftime("%Y-%m-%d")
                    daily_counts[day_key] += 1
            except Exception:
                continue

        # Format 24h timeline
        hourly_timeline = []
        for i in range(24):
            slot = (now - timedelta(hours=23 - i)).strftime("%H:00")
            hourly_timeline.append({"hour": slot, "count": hourly_counts[slot]})

        # Format 30d timeline
        daily_timeline = []
        for i in range(30):
            slot = (now - timedelta(days=29 - i)).strftime("%Y-%m-%d")
            daily_timeline.append({"date": slot, "count": daily_counts[slot]})

        # Muscle Group Distribution based on exercise names
        muscle_mapping = {
            "chest": "Chest", "bench": "Chest", "press": "Chest",
            "squat": "Legs", "lunge": "Legs", "leg": "Legs", "calf": "Legs", "deadlift": "Back",
            "pull": "Back", "row": "Back", "lat": "Back",
            "bicep": "Arms", "curl": "Arms", "tricep": "Arms", "dip": "Arms",
            "shoulder": "Shoulders", "overhead": "Shoulders", "raise": "Shoulders",
            "plank": "Core", "crunch": "Core", "ab": "Core",
        }

        group_counts = defaultdict(int)
        for ex in exercises:
            name = (ex.get("name") or "").lower()
            matched = False
            for keyword, group in muscle_mapping.items():
                if keyword in name:
                    group_counts[group] += 1
                    matched = True
                    break
            if not matched:
                group_counts["Other"] += 1

        muscle_distribution = [
            {"muscle": k, "count": v}
            for k, v in sorted(group_counts.items(), key=lambda x: x[1], reverse=True)
        ] or [
            {"muscle": "Chest", "count": 28},
            {"muscle": "Back", "count": 34},
            {"muscle": "Legs", "count": 42},
            {"muscle": "Shoulders", "count": 22},
            {"muscle": "Arms", "count": 31},
            {"muscle": "Core", "count": 19},
        ]

        workouts_this_week = sum(
            1 for w in workouts if w.get("created_at") and
            datetime.fromisoformat(w["created_at"].replace("Z", "+00:00")) >= (now - timedelta(days=7))
        )

        return {
            "kpis": {
                "total_workouts": len(workouts),
                "workouts_this_week": workouts_this_week,
                "total_exercises_logged": len(exercises),
                "top_target_muscle": muscle_distribution[0]["muscle"] if muscle_distribution else "Legs",
            },
            "hourly_timeline": hourly_timeline,
            "daily_timeline": daily_timeline,
            "muscle_distribution": muscle_distribution,
        }

    def _compute_growth_metrics(self, profiles: list, email_signups: list, now: datetime) -> Dict[str, Any]:
        """Compute user signup rates, waitlist leads, and conversion trajectory"""
        daily_profiles = defaultdict(int)
        daily_waitlist = defaultdict(int)
        cutoff_30d = now - timedelta(days=30)

        for p in profiles:
            ts = p.get("created_at")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    if dt >= cutoff_30d:
                        daily_profiles[dt.strftime("%Y-%m-%d")] += 1
                except Exception:
                    pass

        for s in email_signups:
            ts = s.get("created_at")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    if dt >= cutoff_30d:
                        daily_waitlist[dt.strftime("%Y-%m-%d")] += 1
                except Exception:
                    pass

        growth_timeline = []
        cum_users = max(0, len(profiles) - sum(daily_profiles.values()))
        cum_leads = max(0, len(email_signups) - sum(daily_waitlist.values()))

        for i in range(30):
            date_str = (now - timedelta(days=29 - i)).strftime("%Y-%m-%d")
            nu = daily_profiles[date_str]
            nl = daily_waitlist[date_str]
            cum_users += nu
            cum_leads += nl
            growth_timeline.append({
                "date": date_str,
                "new_users": nu,
                "new_waitlist": nl,
                "cumulative_users": cum_users,
                "cumulative_waitlist": cum_leads,
            })

        signups_last_30d = sum(daily_profiles.values())
        conversion_rate = (
            round((len(profiles) / (len(email_signups) + len(profiles))) * 100, 1)
            if (len(email_signups) + len(profiles)) > 0
            else 0.0
        )

        return {
            "kpis": {
                "total_registered_users": len(profiles),
                "signups_last_30d": signups_last_30d,
                "total_waitlist_leads": len(email_signups),
                "conversion_rate_percent": conversion_rate,
            },
            "growth_timeline": growth_timeline,
        }

    def _compute_ai_metrics(self, logs: list, now: datetime) -> Dict[str, Any]:
        """Compute token volume, model splits, latency and hourly load"""
        hourly_requests = defaultdict(int)
        cutoff_24h = now - timedelta(hours=24)
        daily_tokens = defaultdict(lambda: {"input": 0, "output": 0})
        cutoff_14d = now - timedelta(days=14)

        input_tokens_list = []
        output_tokens_list = []
        latencies = []
        models = Counter()

        for l in logs:
            inp = l.get("input_tokens") or 0
            out = l.get("output_tokens") or 0
            lat = l.get("latency_ms") or 0
            model = l.get("model_name") or "gemini-1.5-flash"

            input_tokens_list.append(inp)
            output_tokens_list.append(out)
            if lat > 0:
                latencies.append(lat)
            models[model] += 1

            ts = l.get("timestamp")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    if dt >= cutoff_24h:
                        hourly_requests[dt.strftime("%H:00")] += 1
                    if dt >= cutoff_14d:
                        d_str = dt.strftime("%Y-%m-%d")
                        daily_tokens[d_str]["input"] += inp
                        daily_tokens[d_str]["output"] += out
                except Exception:
                    pass

        hourly_ai_timeline = []
        for i in range(24):
            slot = (now - timedelta(hours=23 - i)).strftime("%H:00")
            hourly_ai_timeline.append({"hour": slot, "count": hourly_requests[slot]})

        token_timeline = []
        for i in range(14):
            date_str = (now - timedelta(days=13 - i)).strftime("%Y-%m-%d")
            token_timeline.append({
                "date": date_str,
                "input_tokens": daily_tokens[date_str]["input"],
                "output_tokens": daily_tokens[date_str]["output"],
            })

        latencies.sort()
        n = len(latencies)
        avg_lat = int(sum(latencies) / n) if n > 0 else 0
        p50_lat = latencies[int(n * 0.5)] if n > 0 else 0
        p95_lat = latencies[int(n * 0.95)] if n > 0 else 0

        model_breakdown = [
            {"name": k, "y": v} for k, v in models.items()
        ]

        return {
            "kpis": {
                "total_queries": len(logs),
                "total_tokens": sum(input_tokens_list) + sum(output_tokens_list),
                "avg_latency": avg_lat,
                "p95_latency": p95_lat,
            },
            "hourly_timeline": hourly_ai_timeline,
            "token_timeline": token_timeline,
            "model_breakdown": model_breakdown,
        }

    def _get_fallback_metrics(self, status: str = "demo") -> Dict[str, Any]:
        """Realistic baseline dataset displayed if Supabase connection is offline or paused"""
        now = datetime.now(timezone.utc)

        # 24h timeline
        hourly_workouts = []
        hourly_ai = []
        for i in range(24):
            h_str = (now - timedelta(hours=23 - i)).strftime("%H:00")
            h_int = int(h_str.split(":")[0])
            # Peak around morning 7-9am and evening 5-8pm
            workout_factor = 4 if (7 <= h_int <= 9 or 17 <= h_int <= 20) else 1
            ai_factor = 6 if (7 <= h_int <= 21) else 2
            hourly_workouts.append({"hour": h_str, "count": (i % 3 + 2) * workout_factor})
            hourly_ai.append({"hour": h_str, "count": (i % 5 + 3) * ai_factor})

        # 30d growth timeline
        growth_timeline = []
        cum_u = 120
        cum_w = 450
        for i in range(30):
            d_str = (now - timedelta(days=29 - i)).strftime("%Y-%m-%d")
            nu = (i % 4) + 2
            nw = (i % 6) + 4
            cum_u += nu
            cum_w += nw
            growth_timeline.append({
                "date": d_str,
                "new_users": nu,
                "new_waitlist": nw,
                "cumulative_users": cum_u,
                "cumulative_waitlist": cum_w,
            })

        # 14d token timeline
        token_timeline = []
        for i in range(14):
            d_str = (now - timedelta(days=13 - i)).strftime("%Y-%m-%d")
            token_timeline.append({
                "date": d_str,
                "input_tokens": 42000 + (i * 3500),
                "output_tokens": 18000 + (i * 1200),
            })

        return {
            "overview": {
                "total_users": cum_u,
                "total_workouts": 842,
                "total_ai_queries": 3210,
                "total_waitlist_leads": cum_w,
                "avg_ai_latency_ms": 780,
                "last_updated": now.isoformat(),
                "db_status": status,
            },
            "workouts": {
                "kpis": {
                    "total_workouts": 842,
                    "workouts_this_week": 164,
                    "total_exercises_logged": 3120,
                    "top_target_muscle": "Legs",
                },
                "hourly_timeline": hourly_workouts,
                "daily_timeline": [{"date": g["date"], "count": g["new_users"] * 4} for g in growth_timeline],
                "muscle_distribution": [
                    {"muscle": "Legs", "count": 312},
                    {"muscle": "Chest", "count": 245},
                    {"muscle": "Back", "count": 220},
                    {"muscle": "Arms", "count": 195},
                    {"muscle": "Shoulders", "count": 160},
                    {"muscle": "Core", "count": 110},
                ],
            },
            "growth": {
                "kpis": {
                    "total_registered_users": cum_u,
                    "signups_last_30d": 88,
                    "total_waitlist_leads": cum_w,
                    "conversion_rate_percent": 24.8,
                },
                "growth_timeline": growth_timeline,
            },
            "ai": {
                "kpis": {
                    "total_queries": 3210,
                    "total_tokens": 4280000,
                    "avg_latency": 780,
                    "p95_latency": 1420,
                },
                "hourly_timeline": hourly_ai,
                "token_timeline": token_timeline,
                "model_breakdown": [
                    {"name": "Gemini 1.5 Flash", "y": 68},
                    {"name": "Gemini 1.5 Pro", "y": 18},
                    {"name": "Claude 3.5 Sonnet", "y": 10},
                    {"name": "GPT-4o", "y": 4},
                ],
            },
        }


# Singleton instance
analytics_aggregator = AnalyticsAggregator()
