from typing import Dict, Any, List
import logging
from ..schemas import VolumeCalculatorResult, TopPerformer, PerformanceDataPoint

logger = logging.getLogger(__name__)


class VolumeCalculator:
    """Calculates volume performance and top performers + time series data."""

    @staticmethod
    def calculate(raw_workout_data: Dict, limit: int = 3) -> VolumeCalculatorResult:
        """Calculate top volume performers AND time series data from raw workout data."""
        try:
            workouts = raw_workout_data.get("workouts", [])

            if not workouts:
                logger.info("No workouts available for volume calculation")
                return VolumeCalculatorResult(top_performers=[], time_series={})

            # Track exercise performance over time (now collecting ALL data points)
            exercise_metrics, time_series_data = (
                VolumeCalculator._track_exercise_performance(workouts)
            )

            # Calculate improvements for top performers
            results = VolumeCalculator._calculate_improvements(exercise_metrics)

            # Sort by improvement and return top performers
            results.sort(key=lambda x: x.get("change_percent", 0), reverse=True)

            # Build top performers using schema
            top_performers = [TopPerformer(**result) for result in results[:limit]]

            # Build time series using schema
            time_series = {}
            for exercise_name, data_points in time_series_data.items():
                time_series[exercise_name] = [
                    PerformanceDataPoint(
                        date=point["date"], total_volume=point["total_volume"]
                    )
                    for point in data_points
                ]

            logger.info(
                f"Found {len(results)} exercises with volume data, returning top {limit}"
            )
            logger.info(f"Generated time series for {len(time_series_data)} exercises")

            return VolumeCalculatorResult(
                top_performers=top_performers, time_series=time_series
            )

        except Exception as e:
            logger.error(f"Error calculating volume metrics: {e}")
            return VolumeCalculatorResult(top_performers=[], time_series={})

    @staticmethod
    def _track_exercise_performance(
        workouts: List[Dict],
    ) -> tuple[Dict[str, Dict], Dict[str, List[Dict]]]:
        """Track exercise volume performance over time - returns both summary metrics and full time series."""
        exercise_metrics = {}  # For top performers (first/last)
        time_series_data = {}  # For correlation analysis (all data points)

        for workout in workouts:
            workout_date = workout.get("date", "")
            if not workout_date:
                continue

            for exercise in workout.get("exercises", []):
                exercise_name = exercise.get("exercise_name", "")
                if not exercise_name:
                    continue

                # Calculate total volume for this exercise in this workout
                total_volume = VolumeCalculator._calculate_total_volume_for_exercise(
                    exercise
                )

                if total_volume > 0:
                    # Initialize tracking for this exercise
                    if exercise_name not in exercise_metrics:
                        exercise_metrics[exercise_name] = {
                            "first": None,
                            "last": None,
                            "definition_id": exercise.get("definition_id"),
                        }
                        time_series_data[f"{exercise_name} volume"] = []

                    current_entry = {"date": workout_date, "value": total_volume}

                    # Track first and last for top performers calculation
                    if (
                        not exercise_metrics[exercise_name]["first"]
                        or workout_date
                        < exercise_metrics[exercise_name]["first"]["date"]
                    ):
                        exercise_metrics[exercise_name]["first"] = current_entry
                    if (
                        not exercise_metrics[exercise_name]["last"]
                        or workout_date
                        > exercise_metrics[exercise_name]["last"]["date"]
                    ):
                        exercise_metrics[exercise_name]["last"] = current_entry

                    # Track ALL data points for time series
                    time_series_data[f"{exercise_name} volume"].append(
                        {"date": workout_date, "total_volume": total_volume}
                    )

        # Sort time series data by date for each exercise
        for exercise_name in time_series_data:
            time_series_data[exercise_name].sort(key=lambda x: x["date"])

        return exercise_metrics, time_series_data

    @staticmethod
    def _calculate_total_volume_for_exercise(exercise: Dict) -> float:
        """Calculate the total volume (weight × reps) for an exercise from its sets."""
        total_volume = 0

        for set_data in exercise.get("sets", []):
            weight = set_data.get("weight", 0) or 0
            reps = set_data.get("reps", 0) or 0

            if weight > 0 and reps > 0:
                total_volume += weight * reps

        return total_volume

    @staticmethod
    def _calculate_improvements(exercise_metrics: Dict) -> List[Dict[str, Any]]:
        """Calculate volume improvements for each exercise."""
        results = []

        for exercise_name, data in exercise_metrics.items():
            if data["first"] and data["last"] and data["first"]["value"] > 0:
                first_value = data["first"]["value"]
                last_value = data["last"]["value"]
                change = last_value - first_value
                change_percent = (change / first_value) * 100

                results.append(
                    {
                        "name": exercise_name,
                        "definition_id": data["definition_id"],
                        "first_value": round(first_value, 2),
                        "last_value": round(last_value, 2),
                        "change": round(change, 2),
                        "change_percent": round(change_percent, 1),
                    }
                )

        return results
