from typing import Optional, Dict, List
from datetime import datetime
import logging
from app.schemas.workout_data_bundle import CorrelationData, WorkoutDataBundle, BundleMetadata
from ...utils.one_rm_calc import OneRMCalculator
from .query_builder import WorkoutQueryBuilder
from ..chart_generator.chart_service import ChartService
from ...core.supabase.client import SupabaseClient
from ...core.utils.id_gen import new_uuid
from .correlation_service import CorrelationService 

logger = logging.getLogger(__name__)

class WorkoutGraphService:
    """Service for generating workout data graphs and associated data bundles."""
    
    def __init__(self, supabase_client: SupabaseClient):
        self.query_builder = WorkoutQueryBuilder(supabase_client)
        self.chart_service = ChartService()
        self.correlation_service = CorrelationService()

    # [existing methods remain unchanged]

    def _get_top_performers(self, workout_data: Dict, metric: str, limit: int = 3) -> List[Dict]:
        """
        Extract top performing exercises for a given metric, now grouping by definition_id.
        """
        logger.info(f"Getting top performers for metric: {metric}")
        
        exercise_metrics = {}
        
        # Collect all exercises with their metrics, grouped by definition_id
        for workout in workout_data.get('workouts', []):
            workout_date = workout.get('date', '')
            if not workout_date:
                continue
                
            for exercise in workout.get('exercises', []):
                # Use definition_id as key if available, otherwise use name
                definition_id = exercise.get('definition_id')
                name = exercise.get('exercise_name', '')
                if not name:
                    continue
                
                # Create a consistent key for grouping
                key = str(definition_id) if definition_id else name
                    
                # Get relevant metric based on type
                if metric == "1rm_change":
                    value = 0
                    # Look for existing 1RM calculation in metrics
                    if 'metrics' in exercise and 'highest_1rm' in exercise['metrics']:
                        value = exercise['metrics']['highest_1rm']
                    else:
                        # Calculate 1RM directly from sets using the superior calculator
                        for set_data in exercise.get('sets', []):
                            weight = set_data.get('weight', 0) or 0
                            reps = set_data.get('reps', 0) or 0
                            
                            if weight > 0 and reps > 0:
                                estimated_1rm = OneRMCalculator.calculate(weight, reps)
                                if estimated_1rm and estimated_1rm > value:
                                    value = estimated_1rm
                elif metric == "volume_change":
                    value = exercise.get('metrics', {}).get('total_volume', 0)
                    # Calculate volume if not already in metrics
                    if not value:
                        value = sum((set_data.get('weight', 0) or 0) * (set_data.get('reps', 0) or 0) 
                                for set_data in exercise.get('sets', []))
                else:
                    value = 0
                
                # Skip if no meaningful value was found
                if value <= 0:
                    continue
                    
                if key not in exercise_metrics:
                    exercise_metrics[key] = {
                        'first': None, 
                        'last': None, 
                        'name': name,
                        'definition_id': definition_id
                    }
                
                # Track first and last values for calculating change
                current_entry = {'date': workout_date, 'value': value}
                
                if not exercise_metrics[key]['first'] or workout_date < exercise_metrics[key]['first']['date']:
                    exercise_metrics[key]['first'] = current_entry
                if not exercise_metrics[key]['last'] or workout_date > exercise_metrics[key]['last']['date']:
                    exercise_metrics[key]['last'] = current_entry
        
        # Debug log to help troubleshoot
        logger.debug(f"Found {len(exercise_metrics)} exercises with metrics data")
        
        # Calculate percentage changes
        results = []
        for key, data in exercise_metrics.items():
            if data['first'] and data['last'] and data['first']['value'] > 0:
                first_value = data['first']['value']
                last_value = data['last']['value']
                change = last_value - first_value
                change_percent = (change / first_value) * 100
                
                # Only include exercises with valid progression data
                if last_value > 0:
                    results.append({
                        'name': data['name'],
                        'definition_id': data['definition_id'],
                        'first_value': round(first_value, 2),
                        'last_value': round(last_value, 2),
                        'change': round(change, 2),
                        'change_percent': round(change_percent, 1)
                    })
        
        # Sort by percent change and return top N
        results.sort(key=lambda x: x['change_percent'], reverse=True)
        
        # Log the results for debugging
        if results:
            logger.info(f"Top {metric} performers: {[ex['name'] for ex in results[:limit]]}")
            for idx, ex in enumerate(results[:limit]):
                logger.debug(f"  #{idx+1}: {ex['name']} - {ex['change_percent']}% change ({ex['first_value']} → {ex['last_value']})")
        else:
            logger.warning(f"No significant performers found for {metric}")
        
        return results[:limit]

    def _generate_strength_chart_config(self, top_exercises: List[Dict], workout_data: Dict) -> Dict:
        """Generate chart configuration for strength progress with time series, now using definition_id for grouping."""
        datasets = []
        
        for exercise in top_exercises:
            exercise_name = exercise.get('name')
            definition_id = exercise.get('definition_id')
            data_points = []
            
            # Collect exercise data points with dates
            for workout in workout_data.get('workouts', []):
                workout_date = workout.get('date', '')
                if not workout_date:
                    continue
                    
                # Format date for time axis (YYYY-MM-DD)
                date_iso = workout_date.split('T')[0]
                
                for ex in workout.get('exercises', []):
                    # Match exercises by definition_id first, then by name
                    definition_match = (
                        definition_id and 
                        ex.get('definition_id') and 
                        str(definition_id) == str(ex.get('definition_id'))
                    )
                    
                    name_match = (
                        not definition_id and
                        ex.get('exercise_name', '').strip().title() == exercise_name.strip().title()
                    )
                    
                    if definition_match or name_match:
                        # Calculate highest 1RM using new calculator
                        highest_1rm = 0
                        
                        # Try to get from metrics first
                        if 'metrics' in ex and 'highest_1rm' in ex['metrics']:
                            highest_1rm = ex['metrics']['highest_1rm']
                        else:
                            # Calculate from sets using our improved calculator
                            for set_data in ex.get('sets', []):
                                weight = set_data.get('weight', 0) or 0
                                reps = set_data.get('reps', 0) or 0
                                
                                if weight > 0 and reps > 0:
                                    estimated_1rm = OneRMCalculator.calculate(weight, reps)
                                    if estimated_1rm and estimated_1rm > highest_1rm:
                                        highest_1rm = estimated_1rm
                        
                        if highest_1rm > 0:
                            # Add as DataPoint
                            data_points.append({
                                "x": date_iso,  # Date as x-coordinate
                                "y": highest_1rm  # 1RM as y-coordinate
                            })
                        break
            
            # Only include if we have data points
            if data_points:
                # Sort data points by date
                data_points.sort(key=lambda point: point["x"])
                
                # Log the number of points for this exercise
                logger.info(f"Added {len(data_points)} data points for {exercise_name} to strength chart")
                
                datasets.append({
                    "label": exercise_name,
                    "data": data_points
                })
        
        # Chart-specific configuration for time axis
        chart_options = {
            "scales": {
                "xAxes": [{
                    "type": "time",
                    "time": {
                        "parser": "YYYY-MM-DD",
                        "unit": "day",
                        "displayFormats": {
                            "day": "MMM D"
                        }
                    },
                    "ticks": {
                        "maxRotation": 45,
                        "minRotation": 45
                    }
                }],
                "yAxes": [{
                    "scaleLabel": {
                        "display": True,
                        "labelString": "Estimated 1RM (kg)",
                        "fontColor": "#ffffff",
                        "fontSize": 14
                    }
                }]
            }
        }
        
        # Log overall chart data
        logger.info(f"Strength chart contains {len(datasets)} exercises with data")
        
        return {
            "title": "Strength Progress (Estimated 1RM)",
            "datasets": datasets,
            "options": chart_options
        }
        
    def _generate_volume_chart_config(self, top_exercises: List[Dict], workout_data: Dict) -> Dict:
            """Generate chart configuration for volume progress, now using definition_id for grouping."""
            datasets = []
            logger.info(f"Generating volume chart for {len(top_exercises)} exercises")
            
            for exercise in top_exercises:
                exercise_name = exercise.get('name')
                definition_id = exercise.get('definition_id')
                data_points = []
                
                # Collect volume data points with dates
                for workout in workout_data.get('workouts', []):
                    workout_date = workout.get('date', '')
                    if not workout_date:
                        continue
                        
                    # Format date for time axis (YYYY-MM-DD)
                    date_iso = workout_date.split('T')[0]
                    
                    for ex in workout.get('exercises', []):
                        # Match exercises by definition_id first, then by name
                        definition_match = (
                            definition_id and 
                            ex.get('definition_id') and 
                            str(definition_id) == str(ex.get('definition_id'))
                        )
                        
                        name_match = (
                            not definition_id and
                            ex.get('exercise_name', '').strip().title() == exercise_name.strip().title()
                        )
                        
                        if definition_match or name_match:
                            # Get total volume from metrics or calculate it
                            volume = 0
                            
                            if 'metrics' in ex and 'total_volume' in ex['metrics']:
                                volume = ex['metrics']['total_volume']
                            else:
                                # Calculate volume directly from sets
                                for set_data in ex.get('sets', []):
                                    weight = set_data.get('weight', 0) or 0
                                    reps = set_data.get('reps', 0) or 0
                                    volume += weight * reps
                            
                            if volume > 0:
                                data_points.append({
                                    "x": date_iso,  # Date as x-coordinate
                                    "y": volume     # Volume as y-coordinate
                                })
                            break
                
                # Only add exercises with data points
                if data_points:
                    # Sort data points by date
                    data_points.sort(key=lambda point: point["x"])
                    
                    logger.info(f"Added {len(data_points)} data points for {exercise_name} to volume chart")
                    
                    datasets.append({
                        "label": exercise_name,
                        "data": data_points
                    })
            
            # Chart-specific configuration for time axis
            chart_options = {
                "scales": {
                    "xAxes": [{
                        "type": "time",
                        "time": {
                            "parser": "YYYY-MM-DD",
                            "unit": "day",
                            "displayFormats": {
                                "day": "MMM D"
                            }
                        },
                        "ticks": {
                            "maxRotation": 45,
                            "minRotation": 45
                        }
                    }],
                    "yAxes": [{
                        "scaleLabel": {
                            "display": True,
                            "labelString": "Total Volume (kg × reps)",
                            "fontColor": "#ffffff",
                            "fontSize": 14
                        }
                    }]
                }
            }
            
            logger.info(f"Volume chart contains {len(datasets)} exercises with data")
            
            return {
                "title": "Volume Progress (Weight × Reps)",
                "datasets": datasets,
                "options": chart_options
            }
    
    def _generate_frequency_chart_config(self, workout_dates: List[str]) -> Dict:
        """Generate chart configuration for weekly workout frequency with time series."""
        from datetime import datetime, timedelta
        
        # Parse dates
        dates = []
        for date_str in workout_dates:
            try:
                date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                dates.append(date)
            except (ValueError, TypeError):
                continue
                
        if not dates:
            return {
                "title": "Weekly Workout Frequency",
                "datasets": [{
                    "label": "Workouts per Week",
                    "data": []
                }]
            }
        
        # Find date range (most recent 12 weeks)
        latest_date = max(dates)
        earliest_date = latest_date - timedelta(days=12*7)
        
        # Generate all week starts in range
        current_week = earliest_date - timedelta(days=earliest_date.weekday())  # Start on Monday
        weekly_counts = {}
        
        while current_week <= latest_date:
            week_key = current_week.strftime('%Y-%m-%d')
            weekly_counts[week_key] = 0
            current_week += timedelta(days=7)
        
        # Count workouts per week
        for date in dates:
            if date < earliest_date:
                continue
                
            # Get the week start date (Monday)
            week_start = date - timedelta(days=date.weekday())
            week_key = week_start.strftime('%Y-%m-%d')
            
            if week_key in weekly_counts:
                weekly_counts[week_key] += 1
        
        # Prepare data points in x/y format for time axis
        workout_data_points = [
            {"x": week_date, "y": count}
            for week_date, count in sorted(weekly_counts.items())
        ]
        
        # Calculate average for reference line
        if workout_data_points:
            avg_workouts = sum(point["y"] for point in workout_data_points) / len(workout_data_points)
            avg_data_points = [{"x": point["x"], "y": avg_workouts} for point in workout_data_points]
        else:
            avg_data_points = []
        
        # Week-specific time axis configuration
        chart_options = {
            "scales": {
                "xAxes": [{
                    "type": "time",
                    "time": {
                        "unit": "week",  # Weekly unit for frequency chart
                        "isoWeekday": True,  # Start weeks on Monday
                        "displayFormats": {
                            "week": "MMM D"  # Format as "Feb 10"
                        }
                    }
                }],
                "yAxes": [{
                    "scaleLabel": {
                        "labelString": "Workouts per Week"
                    },
                    "ticks": {
                        "beginAtZero": True,
                        "stepSize": 1
                    }
                }]
            }
        }
        
        datasets = [
            {
                "label": "Workouts",
                "data": workout_data_points,
                "type": "bar"  # Bar chart for workouts
            },
            {
                "label": "Average",
                "data": avg_data_points,
                "type": "line",  # Line chart for average
                "fill": False,
                "borderDash": [5, 5]  # Dashed line for average
            }
        ]
        
        return {
            "title": "Weekly Workout Frequency",
            "datasets": datasets,
            "options": chart_options,
            "type": "bar"  # Specify main chart type
        }
    
    async def add_charts_to_bundle(self, bundle: WorkoutDataBundle, llm) -> Dict[str, str]:
        """
        Generates multiple charts for an existing workout bundle and returns URLs.
        
        Args:
            bundle: The workout data bundle to generate charts for
            llm: Language model instance used for chart customization
            
        Returns:
            Dictionary mapping chart types to their URLs
        """
        try:
            charts = {}
            
            # Get top performers for strength and volume charts
            top_strength = self._get_top_performers(bundle.workout_data, metric="1rm_change", limit=3)
            top_volume = self._get_top_performers(bundle.workout_data, metric="volume_change", limit=3)
            
            # Extract workout dates for frequency chart
            workout_dates = []
            for workout in bundle.workout_data.get('workouts', []):
                date_str = workout.get('date', '')
                if date_str:
                    try:
                        # Handle ISO format strings with or without timezone
                        workout_dates.append(date_str)
                    except (ValueError, TypeError):
                        continue
            
            # Generate strength progress chart config
            strength_config = self._generate_strength_chart_config(top_strength, bundle.workout_data)
            # Use existing chart service for URL generation
            charts["strength_progress"] = self.chart_service.create_quickchart_url(config=strength_config)
            
            # Generate volume progress chart config
            volume_config = self._generate_volume_chart_config(top_volume, bundle.workout_data)
            charts["volume_progress"] = self.chart_service.create_quickchart_url(config=volume_config)
            
            # Generate frequency chart config
            frequency_config = self._generate_frequency_chart_config(workout_dates)
            charts["weekly_frequency"] = self.chart_service.create_quickchart_url(config=frequency_config)
            
            # Store charts in bundle
            # Keep the old chart_url for backward compatibility
            bundle.chart_url = charts.get("strength_progress")
            bundle.chart_urls = charts
            
            # Return all chart URLs
            return charts
            
        except Exception as e:
            logger.error(f"Error generating charts: {str(e)}")
            return {}