# backend/app/services/llm/workout_parser_service.py
import json
import re
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from langchain_core.messages import SystemMessage, HumanMessage

import os
from app.services.llm.base import BaseLLMService
from app.services.cache.exercise_definitions import exercise_cache
from app.schemas.staging import ParsedWorkout, ParsedExercise, ParsedSet

logger = logging.getLogger(__name__)


def normalize_text(text: str) -> str:
    """Normalize text for fuzzy matching."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return " ".join(text.split())


def load_credentials_from_env() -> Tuple[Any, Optional[str]]:
    """Helper to load google credentials from environment if available"""
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    if credentials_json and project_id:
        try:
            from google.oauth2 import service_account
            credentials_info = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info
            ).with_scopes(["https://www.googleapis.com/auth/cloud-platform"])
            return credentials, project_id
        except Exception as e:
            logger.warning(f"Could not load service account from JSON: {e}")
    return None, project_id


class WorkoutParserService(BaseLLMService):
    """
    LLM service to parse raw, unformatted workout notes (Apple Notes, scratchpad)
    into structured workout models with canonical exercise resolution.
    """

    def __init__(self, credentials=None, project_id=None):
        if not credentials:
            env_creds, env_proj = load_credentials_from_env()
            credentials = credentials or env_creds
            project_id = project_id or env_proj

        self.model_name = "gemini-2.5-flash"
        self.temperature = 0.1
        self.streaming = False
        self.credentials = credentials
        self.project_id = project_id
        self.model_kwargs = {}
        self.llm = None

        if credentials and project_id:
            try:
                super().__init__(
                    model_name="gemini-2.5-flash",
                    temperature=0.1,
                    streaming=False,
                    credentials=credentials,
                    project_id=project_id,
                )
            except Exception as e:
                logger.warning(f"Could not initialize ChatGoogleGenerativeAI: {e}")
                self.llm = None
        else:
            logger.info("Google Cloud credentials not found; WorkoutParserService using rule-based parsing")

    def _resolve_relative_date_fallback(
        self, raw_text: str, ref_dt: datetime
    ) -> datetime:
        """Rule-based date resolver fallback for relative tokens."""
        lower = raw_text.lower()
        target_dt = ref_dt

        if "yesterday" in lower or "last night" in lower:
            target_dt = ref_dt - timedelta(days=1)
        elif "2 days ago" in lower:
            target_dt = ref_dt - timedelta(days=2)
        elif "3 days ago" in lower:
            target_dt = ref_dt - timedelta(days=3)

        # Check for day of the week (e.g., 'on tuesday', 'last monday')
        days = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ]
        for idx, day in enumerate(days):
            if day in lower:
                # Calculate days back to that day
                current_weekday = ref_dt.weekday()
                delta_days = (current_weekday - idx) % 7
                if delta_days == 0 and "last " in lower:
                    delta_days = 7
                target_dt = ref_dt - timedelta(days=delta_days)
                break

        return target_dt

    async def _match_exercises(
        self, exercises: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Matches raw exercise names to canonical exercise definitions from cache.
        """
        try:
            cached = await exercise_cache.get_all_exercises()
            if not cached:
                logger.warning("Exercise cache is empty; skipping canonical matching")
                return exercises

            # Build lookup maps
            exact_map = {}
            alias_map = {}
            for ex in cached:
                std_name = ex.get("standard_name", "")
                ex_id = ex.get("id")
                norm_std = normalize_text(std_name)
                exact_map[norm_std] = (ex_id, std_name)

                aliases = ex.get("aliases") or []
                for alias in aliases:
                    if alias:
                        norm_alias = normalize_text(alias)
                        alias_map[norm_alias] = (ex_id, std_name)

            for ex_dict in exercises:
                raw_name = ex_dict.get("exercise_name", "")
                norm_raw = normalize_text(raw_name)

                # 1. Exact standard name match
                if norm_raw in exact_map:
                    ex_id, std_name = exact_map[norm_raw]
                    ex_dict["definition_id"] = ex_id
                    ex_dict["matched_canonical_name"] = std_name
                    continue

                # 2. Exact alias match
                if norm_raw in alias_map:
                    ex_id, std_name = alias_map[norm_raw]
                    ex_dict["definition_id"] = ex_id
                    ex_dict["matched_canonical_name"] = std_name
                    continue

                # 3. Substring / Token overlap match
                best_match = None
                best_score = 0

                raw_tokens = set(norm_raw.split())
                for cand_norm, (ex_id, std_name) in exact_map.items():
                    cand_tokens = set(cand_norm.split())
                    if not cand_tokens:
                        continue
                    # Overlap ratio
                    overlap = len(raw_tokens.intersection(cand_tokens))
                    score = overlap / max(len(cand_tokens), len(raw_tokens))
                    if score > best_score and score >= 0.5:
                        best_score = score
                        best_match = (ex_id, std_name)

                if best_match:
                    ex_dict["definition_id"] = best_match[0]
                    ex_dict["matched_canonical_name"] = best_match[1]

            return exercises

        except Exception as e:
            logger.error(f"Error matching canonical exercises: {e}", exc_info=True)
            return exercises

    async def parse_workout_text(
        self,
        raw_text: str,
        reference_timestamp: Optional[str] = None,
        user_timezone: Optional[str] = "UTC",
        is_imperial: bool = False,
    ) -> ParsedWorkout:
        """
        Parses raw text into a ParsedWorkout object.
        """
        # Parse reference timestamp
        if reference_timestamp:
            try:
                ref_dt = datetime.fromisoformat(reference_timestamp.replace("Z", "+00:00"))
            except Exception:
                ref_dt = datetime.now(timezone.utc)
        else:
            ref_dt = datetime.now(timezone.utc)

        ref_str = ref_dt.strftime("%Y-%m-%d %H:%M:%S UTC (%A)")

        prompt_system = (
            "You are an expert fitness data parser for the Volc strength training app.\n"
            "Your job is to parse raw user notes (from Apple Notes, messaging, scratchpads, etc.) into structured workout JSON.\n"
            f"Reference datetime: {ref_str}. User timezone: {user_timezone}. User preferred unit: {'lbs' if is_imperial else 'kg'}.\n\n"
            "Rules:\n"
            "1. Resolve relative dates (e.g. 'Yesterday', 'Tue night', 'today at 5pm') relative to the reference datetime. "
            "Output `workout_timestamp` in ISO 8601 UTC format (e.g. '2026-09-26T17:00:00Z').\n"
            "2. Infer an appropriate `name` for the workout (e.g., 'Push Day', 'Chest & Triceps', 'Leg Day', 'Upper Body').\n"
            "3. Extract all exercises in order. For each exercise:\n"
            "   - `exercise_name`: Clean standard or recognized name of the movement (e.g., 'Bench Press', 'Incline Dumbbell Press', 'Barbell Back Squat').\n"
            "   - `order_index`: 0-indexed order of the exercise.\n"
            "   - `notes`: Any specific notes mentioned for that exercise.\n"
            "   - `sets`: Array of sets. For each set:\n"
            "     - `set_number`: 1, 2, 3...\n"
            "     - `weight`: Numeric weight value (float or int). If bodyweight without added weight, set to null or 0.\n"
            "     - `reps`: Number of repetitions (int).\n"
            "     - `rpe`: Rate of perceived exertion 1-10 if noted (e.g., '@ 8', 'rpe 9').\n"
            "     - `duration`: Duration in seconds if time-based (e.g., '60s plank' -> 60).\n"
            "     - `distance`: Distance in meters/km if applicable.\n"
            "4. Expand compact notations:\n"
            "   - '3x8 @ 80kg' -> 3 separate sets each with reps=8, weight=80\n"
            "   - '100 x 5, 5, 5' -> 3 sets with weight=100 and reps=5\n"
            "   - '135x10, 185x8, 205x6' -> 3 sets with progressive weights/reps\n"
            "5. Determine `detected_unit`: 'lbs' or 'kg' based on explicit annotations in the text or default to user preference.\n\n"
            "Output MUST be strict, valid JSON with NO explanation or markdown ticks, matching this schema:\n"
            "{\n"
            '  "name": "Push Day",\n'
            '  "workout_timestamp": "2026-09-26T17:00:00Z",\n'
            '  "notes": "Felt energetic",\n'
            '  "detected_unit": "kg",\n'
            '  "exercises": [\n'
            "    {\n"
            '      "exercise_name": "Bench Press",\n'
            '      "order_index": 0,\n'
            '      "notes": null,\n'
            '      "sets": [\n'
            '        { "set_number": 1, "weight": 80.0, "reps": 8, "rpe": 8.0, "duration": null, "distance": null }\n'
            "      ]\n"
            "    }\n"
            "  ]\n"
            "}"
        )

        user_content = f"Raw Workout Text:\n\"\"\"\n{raw_text}\n\"\"\""

        messages = [
            SystemMessage(content=prompt_system),
            HumanMessage(content=user_content),
        ]

        parsed_data = None
        if self.llm is not None:
            try:
                response = await self.invoke(messages)
                raw_output = response.content if hasattr(response, "content") else str(response)

                # Strip markdown fences if present
                cleaned = raw_output.strip()
                if cleaned.startswith("```"):
                    cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
                    cleaned = re.sub(r"\n?```$", "", cleaned)
                cleaned = cleaned.strip()

                parsed_data = json.loads(cleaned)

            except Exception as e:
                logger.error(f"LLM parsing failed or produced invalid JSON: {e}", exc_info=True)
                # Fallback to rule-based parser
                parsed_data = self._fallback_regex_parse(raw_text, ref_dt, is_imperial)
        else:
            parsed_data = self._fallback_regex_parse(raw_text, ref_dt, is_imperial)

        # Validate timestamp
        workout_ts = parsed_data.get("workout_timestamp")
        if not workout_ts:
            fallback_dt = self._resolve_relative_date_fallback(raw_text, ref_dt)
            workout_ts = fallback_dt.isoformat()
            parsed_data["workout_timestamp"] = workout_ts

        # Exercise canonical matching pass
        raw_exercises = parsed_data.get("exercises", [])
        matched_exercises = await self._match_exercises(raw_exercises)
        parsed_data["exercises"] = matched_exercises

        return ParsedWorkout(**parsed_data)

    def _extract_sets_into_exercise(self, text: str, exercise: Dict[str, Any]):
        """Helper to extract sets from a text string into an exercise dict."""
        weight_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:kg|lbs|lb)", text, re.IGNORECASE)
        default_weight = float(weight_match.group(1)) if weight_match else None

        # Look for compact multiple sets: e.g., "135x10, 185x8, 205x6"
        pair_matches = list(re.finditer(r"(\d+(?:\.\d+)?)\s*(?:x|\*)\s*(\d+)", text, re.IGNORECASE))
        if len(pair_matches) > 1:
            for m in pair_matches:
                n1, n2 = float(m.group(1)), int(m.group(2))
                wt, reps = (n1, n2) if n1 > 20 or "." in m.group(1) else (default_weight, int(n2))
                exercise["sets"].append({
                    "set_number": len(exercise["sets"]) + 1,
                    "weight": wt,
                    "reps": reps,
                    "rpe": None,
                    "duration": None,
                    "distance": None,
                })
            return

        # Look for standard "3x8 @ 80kg" or "3x8" or "80kg 3x8"
        set_match = re.search(r"(\d+)\s*(?:x|\*)\s*(\d+)(?:\s*(?:@|at)\s*(\d+(?:\.\d+)?))?", text, re.IGNORECASE)
        rpe_match = re.search(r"(?:rpe|@)\s*(\d+(?:\.\d+)?)", text, re.IGNORECASE)
        rpe_val = float(rpe_match.group(1)) if rpe_match else None

        if set_match:
            num_sets = int(set_match.group(1))
            reps = int(set_match.group(2))
            wt = None
            if set_match.group(3):
                wt = float(set_match.group(3))
            elif weight_match:
                wt = float(weight_match.group(1))

            start_num = len(exercise["sets"]) + 1
            for s_idx in range(num_sets):
                exercise["sets"].append({
                    "set_number": start_num + s_idx,
                    "weight": wt,
                    "reps": reps,
                    "rpe": rpe_val,
                    "duration": None,
                    "distance": None,
                })
        else:
            reps_match = re.search(r"(\d+)\s*(?:reps?|r)", text, re.IGNORECASE)
            reps = int(reps_match.group(1)) if reps_match else 10
            wt = float(weight_match.group(1)) if weight_match else None
            exercise["sets"].append({
                "set_number": len(exercise["sets"]) + 1,
                "weight": wt,
                "reps": reps,
                "rpe": rpe_val,
                "duration": None,
                "distance": None,
            })

    def _fallback_regex_parse(
        self, raw_text: str, ref_dt: datetime, is_imperial: bool
    ) -> Dict[str, Any]:
        """
        Deterministic regex parser as a fallback in case LLM is unavailable.
        """
        fallback_dt = self._resolve_relative_date_fallback(raw_text, ref_dt)
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

        exercises = []
        current_exercise = None
        order_index = 0
        detected_unit = "lbs" if "lb" in raw_text.lower() else "kg"
        workout_name = "Staged Workout"

        for line in lines:
            lower_line = line.lower()

            # 1. Check if first line is a title / session label
            if not exercises and any(kw in lower_line for kw in ["day", "push", "pull", "leg", "workout", "upper", "lower", "full body", "yesterday", "today"]):
                if not re.search(r"\d+\s*(?:x|\*)\s*\d+", line):
                    cleaned_title = re.sub(
                        r"^(yesterday|today|last night|\w+day|\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-:]?\s*",
                        "",
                        line,
                        flags=re.IGNORECASE,
                    ).strip()
                    if cleaned_title:
                        workout_name = cleaned_title.title()
                    continue

            # 2. Check if line contains a colon: "Bench Press: 80kg 3x8"
            if ":" in line:
                parts = line.split(":", 1)
                ex_name = re.sub(r"^[-*#\d\.]+\s*", "", parts[0]).strip()
                sets_part = parts[1].strip()

                current_exercise = {
                    "exercise_name": ex_name,
                    "order_index": order_index,
                    "notes": None,
                    "sets": [],
                }
                exercises.append(current_exercise)
                order_index += 1

                self._extract_sets_into_exercise(sets_part, current_exercise)
                continue

            # 3. Check if line is a set line belonging to the current exercise
            set_match = re.search(r"\d+\s*(?:x|\*)\s*\d+", line, re.IGNORECASE)
            if set_match and current_exercise:
                self._extract_sets_into_exercise(line, current_exercise)
            elif not set_match and len(line) > 2 and not line.startswith("@"):
                ex_name = re.sub(r"^[-*#\d\.]+\s*", "", line).strip()
                current_exercise = {
                    "exercise_name": ex_name,
                    "order_index": order_index,
                    "notes": None,
                    "sets": [],
                }
                exercises.append(current_exercise)
                order_index += 1

        if not exercises:
            exercises.append({
                "exercise_name": "Workout Exercise",
                "order_index": 0,
                "notes": raw_text[:100],
                "sets": [
                    {
                        "set_number": 1,
                        "weight": None,
                        "reps": 10,
                        "rpe": None,
                        "duration": None,
                        "distance": None,
                    }
                ],
            })

        return {
            "name": workout_name,
            "workout_timestamp": fallback_dt.isoformat(),
            "notes": raw_text,
            "detected_unit": detected_unit,
            "exercises": exercises,
        }
