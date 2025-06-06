from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class GoalProgress(BaseModel):
    percentage: int
    currentValue: str
    targetValue: str
    label: str

class MuscleBalance(BaseModel):
    muscle: str
    sets: int

class Consistency(BaseModel):
    workoutDays: List[int]
    streak: int
    totalWorkouts: int
    score: int

class DashboardResponse(BaseModel):
    goalProgress: GoalProgress
    muscleBalance: List[MuscleBalance]
    consistency: Consistency

def get_muscle_balance_data():
    """Group detailed muscle data into display categories"""
    MUSCLE_GROUPS = {
        "Shoulders": ["Front delts", "Side delts", "Rear delts"],
        "Back": ["Lats", "Lower back", "Traps"],  
        "Core": ["Abdominals", "Obliques", "Hip flexors"],
        "Chest": ["Chest"],
        "Arms": ["Biceps", "Triceps", "Forearms"],
        "Legs": ["Calves", "Quads", "Hamstrings", "Glutes"],
        "Cardio": ["Cardio"]
    }
    
    # Mock detailed muscle data (replace with actual DB query)
    raw_muscle_data = {
        "Chest": 24,
        "Front delts": 6, "Side delts": 8, "Rear delts": 4,
        "Lats": 16, "Lower back": 4, "Traps": 8,
        "Biceps": 8, "Triceps": 10, "Forearms": 4,
        "Quads": 8, "Hamstrings": 4, "Glutes": 2, "Calves": 2,
        "Abdominals": 12, "Obliques": 4, "Hip flexors": 4,
        "Cardio": 3
    }
    
    # Group and sum
    grouped = []
    for group_name, muscles in MUSCLE_GROUPS.items():
        total_sets = sum(raw_muscle_data.get(muscle, 0) for muscle in muscles)
        if total_sets > 0:
            grouped.append(MuscleBalance(muscle=group_name, sets=total_sets))
    
    return grouped

@router.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard_data():
    """Get dashboard analytics data"""
    return DashboardResponse(
        goalProgress=GoalProgress(
            percentage=75,
            currentValue="90kg",
            targetValue="120kg",
            label="30kg to goal"
        ),
        muscleBalance=get_muscle_balance_data(),
        consistency=Consistency(
            workoutDays=[1, 3, 5, 8, 10, 12, 14],
            streak=3,
            totalWorkouts=7,
            score=85
        )
    )