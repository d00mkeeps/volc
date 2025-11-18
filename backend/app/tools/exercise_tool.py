from langchain.tools import tool
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

@tool
async def get_exercises_by_muscle_groups(
    muscle_groups: List[str],
    base_movement: Optional[str] = None,
    equipment: Optional[List[str]] = None,
    experience_level: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Fetch exercises targeting specific muscle groups from the exercise database.
    
    Use this tool when creating workout plans to get relevant exercise options.
    Call this once you understand the user's goals and target muscle groups.
    
    When modifying workouts, use the exercises already available in your context.
    Only call the exercise tool again if the user requests muscle groups you haven't 
    fetched yet (e.g., if they want to add legs to a chest workout).
    
    Args:
        muscle_groups: Target muscle groups (e.g. ['chest', 'triceps', 'shoulders']).
                      Valid: chest, back, shoulders, biceps, triceps, lats, traps,
                      quadriceps, hamstrings, glutes, abs, obliques, forearms,
                      abductors, adductors, hip_flexors, lower_back
        
        base_movement: (Optional) Filter by movement type. 
                      Valid: ab_wheel, back_extension, bench_press, bicep_curl, 
                      bulgarian_split_squat, calf_raise, chest_fly, crunch, deadlift, 
                      dip, face_pull, farmers_walk, front_raise, good_morning, hip_thrust, 
                      lateral_raise, lat_pulldown, leg_curl, leg_extension, leg_press, 
                      leg_raise, lunge, mobility, nordic_curl, overhead_tricep_extension, 
                      plank, pullup, pushup, reverse_fly, romanian_deadlift, row, 
                      russian_twist, shoulder_press, shrug, skullcrusher, squat, 
                      tricep_pushdown, upright_row
                      
                      Use 'mobility' for stretches, mobility work, and warm-up movements.
        
        equipment: (Optional) Filter by available equipment
        
        experience_level: (Optional) Filter by difficulty - 'beginner', 'intermediate', 'advanced'
    
    Returns:
        List of exercises with: id, standard_name, primary_muscles,
        secondary_muscles, equipment, movement_pattern, base_movement. 
        IMPORTANT: Use the 'id' field as 'definition_id' when creating workout templates.
    
    Examples:
        - Hip mobility/stretches: get_exercises_by_muscle_groups(['hip_flexors'], base_movement='mobility')
        - All squat variations: get_exercises_by_muscle_groups(['quadriceps'], base_movement='squat')
        - All chest exercises: get_exercises_by_muscle_groups(['chest'])
        - Only bench press variations: get_exercises_by_muscle_groups(['chest'], base_movement='bench_press')
    """
    from app.services.cache.exercise_definitions import exercise_cache
    
    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()
    
    logger.info(f"🔧 Tool called: muscle_groups={muscle_groups}, base_movement={base_movement}, equipment={equipment}")
    
    # Normalize muscle groups for matching
    normalized_groups = [mg.lower().strip() for mg in muscle_groups]
    
    # Filter by muscle groups
    filtered = []
    for exercise in all_exercises:
        primary_muscles = exercise.get('primary_muscles', [])
        normalized_primary = [m.lower().strip() for m in primary_muscles]
        
        if any(muscle in normalized_primary for muscle in normalized_groups):
            filtered.append(exercise)
    
    # Filter by base_movement
    if base_movement:
        base_movement_normalized = base_movement.lower().strip()
        filtered = [
            ex for ex in filtered 
            if ex.get('base_movement', '').lower().strip() == base_movement_normalized
        ]
        logger.info(f"  └─ Filtered to base_movement='{base_movement}': {len(filtered)} exercises")
    
    # Optional: Filter by equipment (TEMPORARILY DISABLED)
    if equipment:
        logger.info(f"  └─ Equipment filter requested but temporarily disabled: {equipment}")
    
    # Optional: Filter by experience level (ready for future use)
    if experience_level:
        logger.info(f"  └─ Experience level filter requested but not yet implemented: {experience_level}")
    
    # Return condensed version without descriptions to reduce context size
    condensed = []
    for ex in filtered:
        condensed.append({
            'id': ex['id'],
            'standard_name': ex['standard_name'],
            'primary_muscles': ex.get('primary_muscles'),
            'secondary_muscles': ex.get('secondary_muscles'),
            'equipment': ex.get('equipment'),
            'movement_pattern': ex.get('movement_pattern'),
            'base_movement': ex.get('base_movement'),
        })
    
    logger.info(f"✅ Tool returning {len(condensed)} exercises (condensed, no descriptions)")
    return condensed


@tool
async def get_cardio_exercises(
    base_movement: Optional[str] = None,
    equipment: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch cardio exercises from the exercise database.
    
    Use this tool when creating workout plans that include cardiovascular training.
    
    Args:
        base_movement: (Optional) Filter by cardio type.
                      Valid: running, cycling, swimming, rowing, elliptical, 
                      stair_climber, jump_rope, hiking, walking
        
        equipment: (Optional) Filter by equipment type.
                  Valid: machine, bodyweight
    
    Returns:
        List of cardio exercises with: id, standard_name, primary_muscles,
        secondary_muscles, equipment, movement_pattern, base_movement, major_variation.
        IMPORTANT: Use the 'id' field as 'definition_id' when creating workout templates.
    
    Examples:
        - All cardio: get_cardio_exercises()
        - All running: get_cardio_exercises(base_movement='running')
        - Machine cardio only: get_cardio_exercises(equipment='machine')
        - Outdoor running: get_cardio_exercises(base_movement='running', equipment='bodyweight')
    """
    from app.services.cache.exercise_definitions import exercise_cache
    
    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()
    
    logger.info(f"🏃 Cardio tool called: base_movement={base_movement}, equipment={equipment}")
    
    # Filter for cardiovascular exercises
    filtered = [
        ex for ex in all_exercises
        if 'cardiovascular_system' in [m.lower().strip() for m in ex.get('primary_muscles', [])]
    ]
    
    logger.info(f"  └─ Found {len(filtered)} total cardio exercises")
    
    # Filter by base_movement
    if base_movement:
        base_movement_normalized = base_movement.lower().strip()
        filtered = [
            ex for ex in filtered 
            if ex.get('base_movement', '').lower().strip() == base_movement_normalized
        ]
        logger.info(f"  └─ Filtered to base_movement='{base_movement}': {len(filtered)} exercises")
    
    # Filter by equipment
    if equipment:
        equipment_normalized = equipment.lower().strip()
        filtered = [
            ex for ex in filtered 
            if ex.get('equipment', '').lower().strip() == equipment_normalized
        ]
        logger.info(f"  └─ Filtered to equipment='{equipment}': {len(filtered)} exercises")
    
    # Return condensed version without descriptions to reduce context size
    condensed = []
    for ex in filtered:
        condensed.append({
            'id': ex['id'],
            'standard_name': ex['standard_name'],
            'primary_muscles': ex.get('primary_muscles'),
            'secondary_muscles': ex.get('secondary_muscles'),
            'equipment': ex.get('equipment'),
            'movement_pattern': ex.get('movement_pattern'),
            'base_movement': ex.get('base_movement'),
            'major_variation': ex.get('major_variation'),
        })
    
    logger.info(f"✅ Cardio tool returning {len(condensed)} exercises")
    return condensed