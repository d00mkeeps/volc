from typing import List, Dict, Any, TypedDict
from datetime import datetime
from .exercise_selector import ExerciseSelector, ExerciseSelection

class ChartConfiguration(TypedDict):
    """Complete configuration for a 1RM progress chart."""
    title: str
    datasets: List[Dict[str, Any]]  # Each dict contains label and data
    labels: List[str]

async def generate_chart_config(
    workouts: Dict[str, Any],
    original_query: str,
    llm
) -> ChartConfiguration:
    """Converts workout data into chart configuration using LLM only for exercise selection."""
    
    # Extract all unique exercises
    available_exercises = set()
    for workout in workouts['workouts']:
        for exercise in workout['exercises']:
            available_exercises.add(exercise['exercise_name'].lower())

    # Use LLM to select relevant exercises
    selector = ExerciseSelector(llm)
    selection = await selector.select_exercises(
        query=original_query,
        available_exercises=list(available_exercises)
    )

    # Process data deterministically
    all_dates = sorted(set(
        datetime.fromisoformat(workout['date']).strftime('%d-%m-%Y')
        for workout in workouts['workouts']
    ))
    
    # Process only selected exercises
    datasets = []
    for exercise_name in selection.exercises:
        exercise_data = []
        for date in all_dates:
            # Find matching workout data
            matching_workouts = [
                w for w in workouts['workouts'] 
                if datetime.fromisoformat(w['date']).strftime('%d-%m-%Y') == date
            ]
            
            # Get 1RM value if available
            value = None
            for workout in matching_workouts:
                for exercise in workout['exercises']:
                    if exercise['exercise_name'].lower() == exercise_name:
                        value = exercise['metrics']['highest_1rm']
                        break
                if value is not None:
                    break
            
            if value is not None:
                exercise_data.append(value)

        if exercise_data:  # Only include if we have data
            datasets.append({
                "label": exercise_name,
                "data": exercise_data
            })

    # Generate title based on selection
    title = f"1RM Progress: {', '.join(selection.exercises).title()}"
    
    return ChartConfiguration(
        title=title,
        datasets=datasets,
        labels=all_dates
    )