import asyncio
import json
import pytest
from unittest.mock import AsyncMock, patch, ANY
import uuid
from datetime import datetime

from langchain_anthropic import ChatAnthropic
from app.services.workout_analysis_service import WorkoutAnalysisService
from app.core.supabase.client import SupabaseClient
from app.schemas.workout_data_bundle import WorkoutDataBundle

@pytest.fixture
def sample_workout():
    """Sample workout data for testing"""
    return {
        "id": "workout-123",
        "user_id": "user-456",
        "name": "Monday Strength",
        "date": "2025-03-15T10:30:00Z",
        "workout_exercises": [
            {
                "name": "Bench Press",
                "sets": [
                    {"weight": 80, "reps": 8, "estimated_1rm": 101},
                    {"weight": 85, "reps": 6, "estimated_1rm": 102},
                    {"weight": 90, "reps": 4, "estimated_1rm": 103}
                ]
            },
            {
                "name": "Squat", 
                "sets": [
                    {"weight": 100, "reps": 8, "estimated_1rm": 126},
                    {"weight": 110, "reps": 6, "estimated_1rm": 132},
                ]
            }
        ]
    }

@pytest.fixture
def sample_historical_data():
    """Sample historical workout data returned by Supabase"""
    return {
        "metadata": {
            "total_workouts": 10, 
            "total_exercises": 5, 
            "date_range": {"earliest": "2025-01-15", "latest": "2025-03-15"},
            "exercises_included": ["Bench Press", "Squat"]
        },
        "workouts": [
            {
                "id": "workout-100",
                "date": "2025-01-15T10:00:00Z",
                "exercises": [
                    {
                        "exercise_name": "Bench Press",
                        "sets": [{"weight": 70, "reps": 8, "estimated_1rm": 88}],
                        "metrics": {"total_volume": 560, "total_sets": 1}
                    }
                ]
            },
            {
                "id": "workout-110",
                "date": "2025-02-15T10:00:00Z",
                "exercises": [
                    {
                        "exercise_name": "Bench Press",
                        "sets": [{"weight": 75, "reps": 8, "estimated_1rm": 95}],
                        "metrics": {"total_volume": 600, "total_sets": 1}
                    }
                ]
            },
            {
                "id": "workout-120",
                "date": "2025-03-15T10:00:00Z",
                "exercises": [
                    {
                        "exercise_name": "Bench Press",
                        "sets": [{"weight": 80, "reps": 8, "estimated_1rm": 101}],
                        "metrics": {"total_volume": 640, "total_sets": 1}
                    }
                ]
            }
        ]
    }

@pytest.mark.asyncio
async def test_workout_bundle_creation(sample_workout, sample_historical_data):
    """Test the core workout analysis functionality: input workout → output bundle"""
    
    # Mock dependencies
    mock_llm = AsyncMock(spec=ChatAnthropic)
    mock_supabase = AsyncMock(spec=SupabaseClient)
    
    # Configure mock to return historical data
    mock_supabase.query_workouts.return_value = sample_historical_data
    
    # For the WorkoutQueryBuilder.fetch_exercise_data method
    with patch('app.services.workout_analysis.query_builder.WorkoutQueryBuilder.fetch_exercise_data', 
              new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = sample_historical_data
        
        # For the graph service to avoid generating actual charts
        with patch('app.services.workout_analysis.graph_service.WorkoutGraphService.add_charts_to_bundle', 
                  new_callable=AsyncMock) as mock_charts:
            mock_charts.return_value = {
                "strength_progress": "https://example.com/chart1.png",
                "volume_progress": "https://example.com/chart2.png"
            }
            
            # Create service
            service = WorkoutAnalysisService(llm=mock_llm, supabase_client=mock_supabase)
            
            # Create a message collector to capture outputs
            class MessageCollector:
                def __init__(self):
                    self.messages = []
                
                async def send_text(self, text):
                    self.messages.append(json.loads(text))
            
            collector = MessageCollector()
            
            # Create analyze_workout message
            message = {
                "type": "analyze_workout",
                "data": json.dumps(sample_workout),
                "message": "How has my bench press improved?"
            }
            
            # Set up to capture the first bundle output
            bundle_output = None
            async def get_first_bundle(message):
                nonlocal bundle_output
                if message.get("type") == "workout_data_bundle":
                    bundle_output = message.get("data")
                    return True
                return False
            
            # Process with a patched _send_json_safe to capture outputs
            with patch.object(service, '_send_json_safe', 
                             side_effect=lambda ws, msg: get_first_bundle(msg) or collector.send_text(json.dumps(msg))):
                await service.process_message(collector, message, "conv-789")
            
            # Verify a bundle was created
            assert bundle_output is not None
            
            # Test that the bundle has the expected structure
            assert "bundle_id" in bundle_output
            assert "workout_data" in bundle_output
            assert "metadata" in bundle_output
            assert "chart_urls" in bundle_output
            
            # Verify metrics were calculated
            assert "metrics" in bundle_output["workout_data"]
            metrics = bundle_output["workout_data"]["metrics"]
            
            # Check for specific metric categories
            assert "exercise_progression" in metrics
            assert "strength_progression" in metrics
            assert "workout_frequency" in metrics
            
            # Verify top performers were extracted
            assert "top_performers" in bundle_output
            assert "strength" in bundle_output["top_performers"]
            assert "volume" in bundle_output["top_performers"]
            
            # Verify consistency metrics were calculated
            assert "consistency_metrics" in bundle_output
            assert "score" in bundle_output["consistency_metrics"]