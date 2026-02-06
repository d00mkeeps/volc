from langchain.tools import tool
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


# Muscle group expansion mapping
MUSCLE_EXPANSIONS = {
    "back": ["back", "lats", "traps", "upper_back", "lower_back", "erector_spinae"],
    "legs": ["quadriceps", "hamstrings", "glutes", "calves", "quads", "hams", "abductors", "adductors"],
    "core": ["abs", "obliques", "lower_back", "core", "rectus_abdominis"],
    "arms": ["biceps", "triceps", "forearms", "brachialis"],
    "shoulders": ["shoulders", "deltoids", "traps", "anterior_deltoid", "lateral_deltoid", "posterior_deltoid"],
    "chest": ["chest", "pectorals", "pectoralis_major", "pectoralis_minor"]
}


@tool
async def get_strength_exercises(
    muscle_groups: List[str],
    equipment: Optional[List[str]] = None,
    experience_level: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch resistance training and muscle-building exercises (e.g. weightlifting, calisthenics, powerlifting).

    Use this tool as the PRIMARY source for creating the main 'working' part of a workout plan.
    It returns exercises that target specific muscles with load.

    Args:
        muscle_groups: Target muscle groups (e.g. ['chest', 'triceps']).
                      Valid: chest, back, shoulders, biceps, triceps, lats, traps,
                      quadriceps, hamstrings, glutes, abs, obliques, forearms,
                      abductors, adductors, hip_flexors, lower_back

        equipment: (Optional) Equipment filtering is currently DISABLED to ensure broad availability.
                   All matching muscle-group exercises will be returned with their equipment metadata.

        experience_level: (Optional) Filter by difficulty - 'beginner', 'intermediate', 'advanced'

    Returns:
        List of strength exercises with: id, standard_name, primary_muscles,
        secondary_muscles, equipment, movement_pattern.
    """
    from app.services.cache.exercise_definitions import exercise_cache

    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()

    # Expand muscle groups (e.g. 'back' -> ['back', 'lats', 'traps', ...])
    expanded_groups = set()
    for mg in muscle_groups:
        mg_lower = mg.lower().strip()
        expanded_groups.add(mg_lower)
        if mg_lower in MUSCLE_EXPANSIONS:
            expanded_groups.update(MUSCLE_EXPANSIONS[mg_lower])
    
    logger.info(
        f"💪 Strength tool called: muscle_groups={muscle_groups} (expanded: {expanded_groups})"
    )

    # Exclusivity: Exclude mobility and cardio
    base_filtered = [
        ex
        for ex in all_exercises
        if ex.get("base_movement") != "mobility"
        and "cardiovascular_system"
        not in [m.lower().strip() for m in ex.get("primary_muscles", [])]
    ]

    # Filter by expanded muscle groups
    filtered = []
    for exercise in base_filtered:
        primary_muscles = exercise.get("primary_muscles", [])
        normalized_primary = [m.lower().strip() for m in primary_muscles]
        if any(muscle in normalized_primary for muscle in expanded_groups):
            filtered.append(exercise)

    logger.info(
        f"  └─ Filtered to muscles: {len(filtered)} exercises (ignoring equipment filter)"
    )

    # Return condensed version
    condensed = []
    for ex in filtered:
        condensed.append(
            {
                "id": ex["id"],
                "standard_name": ex["standard_name"],
                "primary_muscles": ex.get("primary_muscles"),
                "secondary_muscles": ex.get("secondary_muscles"),
                "equipment": ex.get("equipment"),
                "movement_pattern": ex.get("movement_pattern"),
                "base_movement": ex.get("base_movement"),
            }
        )

    return condensed


@tool
async def get_cardio_exercises(
    base_movement: Optional[str] = None,
    equipment: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch cardiovascular endurance exercises (e.g. running, cycling, swimming, rowing).

    Use this tool for heart health, stamina, calorie burning, and endurance goals.

    Args:
        base_movement: (Optional) Filter by cardio type (e.g. running, cycling).
        equipment: (Optional) Equipment filtering is currently DISABLED.

    Returns:
        List of cardio exercises with: id, standard_name, equipment, base_movement, major_variation.
    """
    from app.services.cache.exercise_definitions import exercise_cache

    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()

    logger.info(
        f"🏃 Cardio tool called: base_movement={base_movement}"
    )

    # Filter for cardiovascular exercises (exclusive check)
    filtered = [
        ex
        for ex in all_exercises
        if "cardiovascular_system"
        in [m.lower().strip() for m in ex.get("primary_muscles", [])]
    ]

    # Filter by base_movement
    if base_movement:
        base_movement_normalized = base_movement.lower().strip()
        filtered = [
            ex
            for ex in filtered
            if ex.get("base_movement", "").lower().strip() == base_movement_normalized
        ]

    # Return condensed version
    condensed = []
    for ex in filtered:
        condensed.append(
            {
                "id": ex["id"],
                "standard_name": ex["standard_name"],
                "primary_muscles": ex.get("primary_muscles"),
                "secondary_muscles": ex.get("secondary_muscles"),
                "equipment": ex.get("equipment"),
                "movement_pattern": ex.get("movement_pattern"),
                "base_movement": ex.get("base_movement"),
                "major_variation": ex.get("major_variation"),
            }
        )

    return condensed


@tool
async def get_mobility_exercises(
    muscle_groups: Optional[List[str]] = None,
    equipment: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch stretching, mobility, and recovery exercises (e.g. 90/90 stretch, foam rolling).

    Use this tool for warm-ups, cool-downs, active recovery, or injury prevention.

    Args:
        muscle_groups: (Optional) Target muscle groups for stretching (e.g. ['glutes', 'hips']).
        equipment: (Optional) Equipment filtering is currently DISABLED.

    Returns:
        List of mobility exercises with: id, standard_name, primary_muscles, equipment, base_movement.
    """
    from app.services.cache.exercise_definitions import exercise_cache

    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()

    # Expand muscle groups
    expanded_groups = set()
    if muscle_groups:
        for mg in muscle_groups:
            mg_lower = mg.lower().strip()
            expanded_groups.add(mg_lower)
            if mg_lower in MUSCLE_EXPANSIONS:
                expanded_groups.update(MUSCLE_EXPANSIONS[mg_lower])

    logger.info(
        f"🧘 Mobility tool called: muscle_groups={muscle_groups} (expanded: {expanded_groups})"
    )

    # Filter for mobility exercises (exclusive check)
    filtered = [ex for ex in all_exercises if ex.get("base_movement") == "mobility"]

    # Filter by muscle groups
    if expanded_groups:
        filtered = [
            ex
            for ex in filtered
            if any(
                m.lower().strip() in expanded_groups
                for m in ex.get("primary_muscles", [])
            )
        ]

    # Return condensed version
    condensed = []
    for ex in filtered:
        condensed.append(
            {
                "id": ex["id"],
                "standard_name": ex["standard_name"],
                "primary_muscles": ex.get("primary_muscles"),
                "secondary_muscles": ex.get("secondary_muscles"),
                "equipment": ex.get("equipment"),
                "movement_pattern": ex.get("movement_pattern"),
                "base_movement": ex.get("base_movement"),
            }
        )

    return condensed
