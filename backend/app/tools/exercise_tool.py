from langchain.tools import tool
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

@tool
async def get_exercises_by_muscle_groups(
    muscle_groups: List[str],
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
                      abductors, adductors, hip_flexors, lower_back, cardiovascular_system
        equipment: (Optional) Filter by available equipment
        experience_level: (Optional) Filter by difficulty - 'beginner', 'intermediate', 'advanced'
    
    Returns:
        List of exercises with: id, standard_name, primary_muscles,
        secondary_muscles, equipment, movement_pattern. 
        IMPORTANT: Use the 'id' field as 'definition_id' when creating workout templates.
    """
    from app.services.cache.exercise_definitions import exercise_cache
    
    # Get all cached exercises
    all_exercises = await exercise_cache.get_all_exercises()
    logger.info(f"🔧 Tool called: muscle_groups={muscle_groups}, equipment={equipment}, experience_level={experience_level}")
    
    # Normalize muscle groups for matching
    normalized_groups = [mg.lower().strip() for mg in muscle_groups]
    
    # Filter by muscle groups
    filtered = []
    for exercise in all_exercises:
        primary_muscles = exercise.get('primary_muscles', [])
        normalized_primary = [m.lower().strip() for m in primary_muscles]
        
        if any(muscle in normalized_primary for muscle in normalized_groups):
            filtered.append(exercise)
    
    # Optional: Filter by equipment (TEMPORARILY DISABLED)
    if equipment:
        logger.info(f"  └─ Equipment filter requested but temporarily disabled: {equipment}")
        # TODO: Implement fuzzy equipment matching
        # For now, just log it and return all exercises for the muscle groups

    # Optional: Filter by experience level (ready for future use)
    if experience_level:
        # Placeholder - implement when you add experience_level to exercise_definitions
        logger.info(f"  └─ Experience level filter requested but not yet implemented: {experience_level}")
    
    # NEW: Return condensed version without descriptions to reduce context size
    condensed = []
    for ex in filtered:
        condensed.append({
            'id': ex['id'],
            'standard_name': ex['standard_name'],
            'primary_muscles': ex.get('primary_muscles'),
            'secondary_muscles': ex.get('secondary_muscles'),
            'equipment': ex.get('equipment'),
            'movement_pattern': ex.get('movement_pattern'),
            # description excluded - saves ~150 chars per exercise
        })
    
    logger.info(f"✅ Tool returning {len(condensed)} exercises (condensed, no descriptions)")
    
    return condensed