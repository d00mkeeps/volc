from langchain.tools import tool
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


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

        equipment: (Optional) Filter by equipment type. Pass as a LIST.
                  Valid: barbell, dumbbell, cable, machine, bodyweight, kettlebell, band

        experience_level: (Optional) Filter by difficulty - 'beginner', 'intermediate', 'advanced'

    Returns:
        List of strength exercises with: id, standard_name, primary_muscles,
        secondary_muscles, equipment, movement_pattern.

    Examples:
        # Get all chest and tricep exercises
        get_strength_exercises(['chest', 'triceps'])

        # Get dumbbell-only leg exercises
        get_strength_exercises(['quadriceps', 'glutes'], equipment=['dumbbell'])

        # Get bodyweight core exercises
        get_strength_exercises(['abs'], equipment=['bodyweight'])
    """
    from app.services.cache.exercise_definitions import exercise_cache

    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()

    logger.info(
        f"💪 Strength tool called: muscle_groups={muscle_groups}, equipment={equipment}"
    )

    # Exclusivity: Exclude mobility and cardio
    base_filtered = [
        ex
        for ex in all_exercises
        if ex.get("base_movement") != "mobility"
        and "cardiovascular_system"
        not in [m.lower().strip() for m in ex.get("primary_muscles", [])]
    ]

    # Filter by muscle groups
    filtered = []
    normalized_groups = [mg.lower().strip() for mg in muscle_groups]
    for exercise in base_filtered:
        primary_muscles = exercise.get("primary_muscles", [])
        normalized_primary = [m.lower().strip() for m in primary_muscles]
        if any(muscle in normalized_primary for muscle in normalized_groups):
            filtered.append(exercise)

    logger.info(
        f"  └─ Filtered to muscle_groups={muscle_groups}: {len(filtered)} exercises"
    )

    # Filter by equipment
    if equipment:
        normalized_equipment = [eq.lower().strip() for eq in equipment]
        filtered = [
            ex
            for ex in filtered
            if (ex.get("equipment") or "").lower().strip() in normalized_equipment
        ]
        logger.info(
            f"  └─ Filtered to equipment={equipment}: {len(filtered)} exercises"
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

    # Logging for observability
    import os
    from datetime import datetime

    log_file = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "testing", "logs", "tool_calls.log"
    )
    os.makedirs(os.path.dirname(log_file), exist_ok=True)

    with open(log_file, "a") as f:
        f.write(f"\n{'='*60}\n")
        f.write(f"[{datetime.now().isoformat()}] get_strength_exercises\n")
        f.write(f"Query: muscle_groups={muscle_groups}, equipment={equipment}\n")
        f.write(f"Returned {len(condensed)} exercises\n")

    logger.info(f"✅ Strength tool returning {len(condensed)} exercises")
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
        base_movement: (Optional) Filter by cardio type.
                      Valid: running, cycling, swimming, rowing, elliptical,
                      stair_climber, jump_rope, hiking, walking

        equipment: (Optional) Filter by equipment type.
                  Valid: machine, bodyweight

    Returns:
        List of cardio exercises with: id, standard_name, equipment, base_movement, major_variation.

    Examples:
        # Get all cardio options
        get_cardio_exercises()

        # Get machine-based cardio (treadmill, rower, etc)
        get_cardio_exercises(equipment='machine')

        # Get running variations
        get_cardio_exercises(base_movement='running')
    """
    from app.services.cache.exercise_definitions import exercise_cache

    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()

    logger.info(
        f"🏃 Cardio tool called: base_movement={base_movement}, equipment={equipment}"
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

    # Filter by equipment
    if equipment:
        equipment_normalized = equipment.lower().strip()
        filtered = [
            ex
            for ex in filtered
            if ex.get("equipment", "").lower().strip() == equipment_normalized
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

    logger.info(f"✅ Cardio tool returning {len(condensed)} exercises")
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

        equipment: (Optional) Filter by equipment type. Pass as a LIST.
                  Valid: foam_roller, lacrosse_ball, band, bodyweight

    Returns:
        List of mobility exercises with: id, standard_name, primary_muscles, equipment, base_movement.

    Examples:
        # Get all stretching/mobility options
        get_mobility_exercises()

        # Get hip and glute stretches
        get_mobility_exercises(muscle_groups=['glutes', 'hips'])

        # Get foam rolling exercises
        get_mobility_exercises(equipment=['foam_roller'])
    """
    from app.services.cache.exercise_definitions import exercise_cache

    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()

    logger.info(
        f"🧘 Mobility tool called: muscle_groups={muscle_groups}, equipment={equipment}"
    )

    # Filter for mobility exercises (exclusive check)
    filtered = [ex for ex in all_exercises if ex.get("base_movement") == "mobility"]

    # Filter by muscle groups
    if muscle_groups:
        normalized_groups = [mg.lower().strip() for mg in muscle_groups]
        filtered = [
            ex
            for ex in filtered
            if any(
                m.lower().strip() in normalized_groups
                for m in ex.get("primary_muscles", [])
            )
        ]

    # Filter by equipment
    if equipment:
        normalized_equipment = [eq.lower().strip() for eq in equipment]
        filtered = [
            ex
            for ex in filtered
            if (ex.get("equipment") or "").lower().strip() in normalized_equipment
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

    logger.info(f"✅ Mobility tool returning {len(condensed)} exercises")
    return condensed
