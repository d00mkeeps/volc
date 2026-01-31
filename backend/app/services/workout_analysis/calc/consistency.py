from typing import Dict, List
from datetime import datetime
import logging
from ..schemas import ConsistencyMetrics

logger = logging.getLogger(__name__)


class ConsistencyCalculator:
    """Calculates workout frequency and consistency metrics."""

    @staticmethod
    def calculate(raw_workout_data: Dict) -> ConsistencyMetrics:
        """Calculate consistency metrics from raw workout data."""
        try:
            workouts = raw_workout_data.get("workouts", [])

            if len(workouts) < 2:
                logger.info("Insufficient workouts for consistency calculation")
                return ConsistencyMetrics(avg_gap=0.0, variance=None)

            # Extract and sort workout dates
            workout_dates = ConsistencyCalculator._extract_workout_dates(workouts)

            if len(workout_dates) < 2:
                logger.warning("Could not parse enough workout dates")
                return ConsistencyMetrics(avg_gap=0.0, variance=None)

            # Calculate gaps between consecutive workouts
            gaps = ConsistencyCalculator._calculate_gaps(workout_dates)

            # Calculate average gap
            avg_gap = sum(gaps) / len(gaps) if gaps else 0.0

            # Calculate variance (only if 3+ workouts)
            variance = None
            if (
                len(gaps) >= 2
            ):  # Need at least 2 gaps (3 workouts) for meaningful variance
                mean_gap = avg_gap
                variance_sum = sum((gap - mean_gap) ** 2 for gap in gaps)
                variance = variance_sum / len(gaps)

            logger.info(
                f"Calculated consistency: avg_gap={avg_gap:.1f}, variance={variance}"
            )

            return ConsistencyMetrics(
                avg_gap=round(avg_gap, 1),
                variance=round(variance, 2) if variance is not None else None,
            )

        except Exception as e:
            logger.error(f"Error calculating consistency metrics: {e}")
            return ConsistencyMetrics(avg_gap=0.0, variance=None)

    @staticmethod
    def _extract_workout_dates(workouts: List[Dict]) -> List[datetime]:
        """Extract and parse workout dates."""
        dates = []

        for workout in workouts:
            date_str = workout.get("date", "")
            if date_str:
                try:
                    # Handle various datetime formats from the database
                    if "T" in date_str:
                        # ISO format: "2025-07-28T10:30:00Z" or "2025-07-28T10:30:00+00:00"
                        date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    else:
                        # Date only: "2025-07-28"
                        date = datetime.fromisoformat(date_str)

                    dates.append(date)
                except (ValueError, TypeError) as e:
                    logger.warning(f"Could not parse workout date '{date_str}': {e}")
                    continue

        return sorted(dates)

    @staticmethod
    def _calculate_gaps(workout_dates: List[datetime]) -> List[float]:
        """Calculate gaps in days between consecutive workouts."""
        gaps = []

        for i in range(1, len(workout_dates)):
            gap_days = (workout_dates[i] - workout_dates[i - 1]).total_seconds() / (
                24 * 3600
            )
            gaps.append(gap_days)

        return gaps
