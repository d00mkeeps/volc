from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
import logging
from app.schemas.workout_data_bundle import CorrelationData, WorkoutDataBundle, BundleMetadata
from .query_builder import WorkoutQueryBuilder
from ..chart_generator.chart_service import ChartService
from ..chart_generator.config_builder import generate_chart_config
from app.core.supabase.client import SupabaseClient
from ...core.utils.id_gen import new_uuid
from .correlation_service import CorrelationService 

logger = logging.getLogger(__name__)

class WorkoutGraphService:
    """Service for generating workout data graphs and associated data bundles."""
    
    def __init__(self, supabase_client: SupabaseClient):
        self.query_builder = WorkoutQueryBuilder(supabase_client)
        self.chart_service = ChartService()
        self.correlation_service = CorrelationService()

    async def create_workout_bundle(self, user_id: str, query_text: str) -> Optional[WorkoutDataBundle]:
        """Creates a workout data bundle with query results and correlation analysis."""
        try:
            # Existing implementation remains unchanged
            logger.debug(f"Extracting query parameters from: {query_text}")
            query = await self.query_extractor.extract(query_text)
            if not query:
                logger.error("Failed to extract query parameters")
                return None
            logger.info(f"Extracted query: {query}")

            logger.info("\nFetching exercise data...")
            formatted_data = await self.query_builder.fetch_exercise_data(
                user_id=user_id,
                query_params=query
            )
            
            if not formatted_data:
                logger.error("No workout data found")
                return None
            logger.info(f"Formatted data: {formatted_data}")

            # Create bundle metadata
            metadata = BundleMetadata(
                total_workouts=formatted_data['metadata']['total_workouts'],
                total_exercises=formatted_data['metadata']['total_exercises'],
                date_range=formatted_data['metadata']['date_range'],
                exercises_included=[
                    exercise['exercise_name'] 
                    for workout in formatted_data['workouts']
                    for exercise in workout['exercises']
                ]
            )

            # Add correlation analysis
            correlation_results = self.correlation_service.analyze_exercise_correlations(formatted_data)

            bundle_id = await new_uuid()

            # Create bundle with correlation data and initialize empty chart_urls dictionary
            bundle = WorkoutDataBundle(
                bundle_id=bundle_id,
                metadata=metadata,
                workout_data=formatted_data,
                original_query=query_text,
                chart_url=None,  # No chart URL yet
                chart_urls={},  # Initialize empty dict for multiple chart URLs
                correlation_data=CorrelationData(**correlation_results) if correlation_results else None,
                created_at=datetime.now()
            )
            
            return bundle

        except Exception as e:
            logger.error(f"Error creating workout bundle: {str(e)}", exc_info=True)
            return None

    # Keep old method for backward compatibility, but make it call the new one
    async def add_chart_to_bundle(self, bundle: WorkoutDataBundle, llm) -> Optional[str]:
        """
        Generates a chart for an existing workout bundle and returns the URL.
        This method is kept for backward compatibility.
        """
        try:
            charts = await self.add_charts_to_bundle(bundle, llm)
            # Return the strength progress chart as the default
            return charts.get("strength_progress")
        except Exception as e:
            logger.error(f"Error generating chart: {str(e)}")
            return None

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
            
    def _get_top_performers(self, workout_data: Dict, metric: str, limit: int = 3) -> List[Dict]:
        """
        Extract top performing exercises for a given metric.
        
        Args:
            workout_data: The workout data dictionary
            metric: The metric to rank by ('1rm_change' or 'volume_change')
            limit: Maximum number of top performers to return
            
        Returns:
            List of top performing exercises with metrics
        """
        exercise_metrics = {}
        
        # Collect all exercises with their metrics
        for workout in workout_data.get('workouts', []):
            workout_date = workout.get('date', '')
            if not workout_date:
                continue
                
            for exercise in workout.get('exercises', []):
                name = exercise.get('exercise_name', '')
                if not name:
                    continue
                    
                # Get relevant metric based on type
                if metric == "1rm_change":
                    value = 0
                    # Extract highest 1RM from sets or metrics if available
                    if 'metrics' in exercise and 'highest_1rm' in exercise['metrics']:
                        value = exercise['metrics']['highest_1rm']
                    else:
                        # Extract from sets if not in metrics
                        for set_data in exercise.get('sets', []):
                            estimated_1rm = set_data.get('estimated_1rm', 0)
                            if estimated_1rm > value:
                                value = estimated_1rm
                elif metric == "volume_change":
                    value = exercise.get('metrics', {}).get('total_volume', 0)
                else:
                    value = 0
                    
                if name not in exercise_metrics:
                    exercise_metrics[name] = {'first': None, 'last': None, 'name': name}
                
                # Track first and last values for calculating change
                current_entry = {'date': workout_date, 'value': value}
                
                if not exercise_metrics[name]['first'] or workout_date < exercise_metrics[name]['first']['date']:
                    exercise_metrics[name]['first'] = current_entry
                if not exercise_metrics[name]['last'] or workout_date > exercise_metrics[name]['last']['date']:
                    exercise_metrics[name]['last'] = current_entry
        
        # Calculate percentage changes
        results = []
        for name, data in exercise_metrics.items():
            if data['first'] and data['last'] and data['first']['value'] > 0:
                # Calculate absolute and percentage change
                first_value = data['first']['value']
                last_value = data['last']['value']
                change = last_value - first_value
                change_percent = (change / first_value) * 100
                
                # Only include exercises with valid progression data
                if last_value > 0:
                    results.append({
                        'name': name,
                        'first_value': round(first_value, 2),
                        'last_value': round(last_value, 2),
                        'change': round(change, 2),
                        'change_percent': round(change_percent, 1)
                    })
        
        # Sort by percent change and return top N
        results.sort(key=lambda x: x['change_percent'], reverse=True)
        return results[:limit]

    def _generate_strength_chart_config(self, top_exercises: List[Dict], workout_data: Dict) -> Dict:
        """Generate chart configuration for strength progress with time series."""
        datasets = []
        
        for exercise in top_exercises:
            exercise_name = exercise.get('name')
            data_points = []
            
            # Collect exercise data points with dates
            for workout in workout_data.get('workouts', []):
                workout_date = workout.get('date', '')
                if not workout_date:
                    continue
                    
                # Format date for time axis (YYYY-MM-DD)
                date_iso = workout_date.split('T')[0]
                
                for ex in workout.get('exercises', []):
                    if ex.get('exercise_name') == exercise_name:
                        # Get highest 1RM value
                        found_1rm = None
                        if 'metrics' in ex and 'highest_1rm' in ex['metrics']:
                            found_1rm = ex['metrics']['highest_1rm']
                        else:
                            # Find highest 1RM in sets
                            max_1rm = 0
                            for set_data in ex.get('sets', []):
                                estimated_1rm = set_data.get('estimated_1rm', 0) or 0
                                if estimated_1rm > max_1rm:
                                    max_1rm = estimated_1rm
                            
                            if max_1rm > 0:
                                found_1rm = max_1rm
                        
                        if found_1rm is not None:
                            # Add as DataPoint
                            data_points.append({
                                "x": date_iso,  # Date as x-coordinate
                                "y": found_1rm  # 1RM as y-coordinate
                            })
                        break
            
            # Only add exercises with data points
            if data_points:
                # Sort data points by date
                data_points.sort(key=lambda point: point["x"])
                
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
        
        return {
            "title": "Strength Progress (Estimated 1RM)",
            "datasets": datasets,
            "options": chart_options
        }
    def _generate_volume_chart_config(self, top_exercises: List[Dict], workout_data: Dict) -> Dict:
        """Generate chart configuration for volume progress with time series."""
        datasets = []
        
        for exercise in top_exercises:
            exercise_name = exercise.get('name')
            data_points = []
            
            # Collect volume data points with dates
            for workout in workout_data.get('workouts', []):
                workout_date = workout.get('date', '')
                if not workout_date:
                    continue
                    
                # Format date for time axis (YYYY-MM-DD)
                date_iso = workout_date.split('T')[0]
                
                for ex in workout.get('exercises', []):
                    if ex.get('exercise_name') == exercise_name:
                        # Get total volume from metrics
                        volume = ex.get('metrics', {}).get('total_volume', 0)
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
                        "labelString": "Total Volume (kg × reps)"
                    }
                }]
            }
        }
        
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