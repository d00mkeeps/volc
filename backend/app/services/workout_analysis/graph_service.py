from typing import Dict, List
import logging
from app.schemas.workout_data_bundle import WorkoutDataBundle
from app.services.db.graph_bundle_service import GraphBundleService
from app.services.db.workout_service import WorkoutService
from ...utils.one_rm_calc import OneRMCalculator
from ..chart_generator.chart_service import ChartService
from .correlation_service import CorrelationService 

logger = logging.getLogger(__name__)

class WorkoutGraphService:
    """Service for generating workout data graphs and associated data bundles."""
    
    def __init__(self, workout_service: WorkoutService, graph_bundle_service: GraphBundleService = None):
        self.workout_service = workout_service
        self.graph_bundle_service = graph_bundle_service
        self.chart_service = ChartService()
        self.correlation_service = CorrelationService()

    def _get_top_performers(self, bundle: WorkoutDataBundle, metric: str, limit: int = 3) -> List[Dict]:
        """Extract top performing exercises for a given metric, now grouping by definition_id."""
        logger.info(f"Getting top performers for metric: {metric}")
        
        exercise_metrics = {}
        
        # Use bundle.raw_workouts instead of workout_data
        for workout in bundle.raw_workouts.get('workouts', []):
            workout_date = workout.get('date', '')
            if not workout_date:
                continue
                
            for exercise in workout.get('exercises', []):
                definition_id = exercise.get('definition_id')
                name = exercise.get('exercise_name', '')
                if not name:
                    continue
                
                key = str(definition_id) if definition_id else name
                    
                if metric == "1rm_change":
                    value = 0
                    for set_data in exercise.get('sets', []):
                        weight = set_data.get('weight', 0) or 0
                        reps = set_data.get('reps', 0) or 0
                        
                        if weight > 0 and reps > 0:
                            estimated_1rm = OneRMCalculator.calculate(weight, reps)
                            if estimated_1rm and estimated_1rm > value:
                                value = estimated_1rm
                elif metric == "volume_change":
                    value = sum((set_data.get('weight', 0) or 0) * (set_data.get('reps', 0) or 0) 
                            for set_data in exercise.get('sets', []))
                else:
                    value = 0
                
                if value <= 0:
                    continue
                    
                if key not in exercise_metrics:
                    exercise_metrics[key] = {
                        'first': None, 
                        'last': None, 
                        'name': name,
                        'definition_id': definition_id
                    }
                
                current_entry = {'date': workout_date, 'value': value}
                
                if not exercise_metrics[key]['first'] or workout_date < exercise_metrics[key]['first']['date']:
                    exercise_metrics[key]['first'] = current_entry
                if not exercise_metrics[key]['last'] or workout_date > exercise_metrics[key]['last']['date']:
                    exercise_metrics[key]['last'] = current_entry
        
        logger.debug(f"Found {len(exercise_metrics)} exercises with metrics data")
        
        results = []
        for key, data in exercise_metrics.items():
            if data['first'] and data['last'] and data['first']['value'] > 0:
                first_value = data['first']['value']
                last_value = data['last']['value']
                change = last_value - first_value
                change_percent = (change / first_value) * 100
                
                if last_value > 0:
                    results.append({
                        'name': data['name'],
                        'definition_id': data['definition_id'],
                        'first_value': round(first_value, 2),
                        'last_value': round(last_value, 2),
                        'change': round(change, 2),
                        'change_percent': round(change_percent, 1)
                    })
        
        results.sort(key=lambda x: x['change_percent'], reverse=True)
        
        if results:
            logger.info(f"Top {metric} performers: {[ex['name'] for ex in results[:limit]]}")
        else:
            logger.warning(f"No significant performers found for {metric}")
        
        return results[:limit]

    def _generate_strength_chart_config(self, top_exercises: List[Dict], bundle: WorkoutDataBundle) -> Dict:
        """Generate chart configuration for strength progress with time series."""
        datasets = []
        
        for exercise in top_exercises:
            exercise_name = exercise.get('name')
            definition_id = exercise.get('definition_id')
            data_points = []
            
            for workout in bundle.raw_workouts.get('workouts', []):
                workout_date = workout.get('date', '')
                if not workout_date:
                    continue
                    
                date_iso = workout_date.split('T')[0]
                
                for ex in workout.get('exercises', []):
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
                        highest_1rm = 0
                        
                        for set_data in ex.get('sets', []):
                            weight = set_data.get('weight', 0) or 0
                            reps = set_data.get('reps', 0) or 0
                            
                            if weight > 0 and reps > 0:
                                estimated_1rm = OneRMCalculator.calculate(weight, reps)
                                if estimated_1rm and estimated_1rm > highest_1rm:
                                    highest_1rm = estimated_1rm
                        
                        if highest_1rm > 0:
                            data_points.append({
                                "x": date_iso,
                                "y": highest_1rm
                            })
                        break
            
            if data_points:
                data_points.sort(key=lambda point: point["x"])
                logger.info(f"Added {len(data_points)} data points for {exercise_name} to strength chart")
                
                datasets.append({
                    "label": exercise_name,
                    "data": data_points
                })
        
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
        
        logger.info(f"Strength chart contains {len(datasets)} exercises with data")
        
        return {
            "title": "Strength Progress (Estimated 1RM)",
            "datasets": datasets,
            "options": chart_options
        }
        
    def _generate_volume_chart_config(self, top_exercises: List[Dict], bundle: WorkoutDataBundle) -> Dict:
        """Generate chart configuration for volume progress."""
        datasets = []
        logger.info(f"Generating volume chart for {len(top_exercises)} exercises")
        
        for exercise in top_exercises:
            exercise_name = exercise.get('name')
            definition_id = exercise.get('definition_id')
            data_points = []
            
            for workout in bundle.raw_workouts.get('workouts', []):
                workout_date = workout.get('date', '')
                if not workout_date:
                    continue
                    
                date_iso = workout_date.split('T')[0]
                
                for ex in workout.get('exercises', []):
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
                        volume = 0
                        for set_data in ex.get('sets', []):
                            weight = set_data.get('weight', 0) or 0
                            reps = set_data.get('reps', 0) or 0
                            volume += weight * reps
                        
                        if volume > 0:
                            data_points.append({
                                "x": date_iso,
                                "y": volume
                            })
                        break
            
            if data_points:
                data_points.sort(key=lambda point: point["x"])
                logger.info(f"Added {len(data_points)} data points for {exercise_name} to volume chart")
                
                datasets.append({
                    "label": exercise_name,
                    "data": data_points
                })
        
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
    
    def _generate_frequency_chart_config(self, bundle: WorkoutDataBundle) -> Dict:
        """Generate chart configuration for weekly workout frequency."""
        from datetime import datetime, timedelta
        
        workout_dates = []
        for workout in bundle.raw_workouts.get('workouts', []):
            date_str = workout.get('date', '')
            if date_str:
                try:
                    workout_dates.append(date_str)
                except (ValueError, TypeError):
                    continue
        
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
        
        latest_date = max(dates)
        earliest_date = latest_date - timedelta(days=12*7)
        
        current_week = earliest_date - timedelta(days=earliest_date.weekday())
        weekly_counts = {}
        
        while current_week <= latest_date:
            week_key = current_week.strftime('%Y-%m-%d')
            weekly_counts[week_key] = 0
            current_week += timedelta(days=7)
        
        for date in dates:
            if date < earliest_date:
                continue
                
            week_start = date - timedelta(days=date.weekday())
            week_key = week_start.strftime('%Y-%m-%d')
            
            if week_key in weekly_counts:
                weekly_counts[week_key] += 1
        
        workout_data_points = [
            {"x": week_date, "y": count}
            for week_date, count in sorted(weekly_counts.items())
        ]
        
        if workout_data_points:
            avg_workouts = sum(point["y"] for point in workout_data_points) / len(workout_data_points)
            avg_data_points = [{"x": point["x"], "y": avg_workouts} for point in workout_data_points]
        else:
            avg_data_points = []
        
        chart_options = {
            "scales": {
                "xAxes": [{
                    "type": "time",
                    "time": {
                        "unit": "week",
                        "isoWeekday": True,
                        "displayFormats": {
                            "week": "MMM D"
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
                "type": "bar"
            },
            {
                "label": "Average",
                "data": avg_data_points,
                "type": "line",
                "fill": False,
                "borderDash": [5, 5]
            }
        ]
        
        return {
            "title": "Weekly Workout Frequency",
            "datasets": datasets,
            "options": chart_options,
            "type": "bar"
        }
    
    async def add_charts_to_bundle(self, bundle: WorkoutDataBundle) -> Dict[str, str]:
        """Generate charts for bundle and return URLs."""
        try:
            charts = {}
            
            top_strength = self._get_top_performers(bundle, metric="1rm_change", limit=3)
            top_volume = self._get_top_performers(bundle, metric="volume_change", limit=3)
            
            strength_config = self._generate_strength_chart_config(top_strength, bundle)
            charts["strength_progress"] = self.chart_service.create_quickchart_url(config=strength_config)
            
            volume_config = self._generate_volume_chart_config(top_volume, bundle)
            charts["volume_progress"] = self.chart_service.create_quickchart_url(config=volume_config)
            
            frequency_config = self._generate_frequency_chart_config(bundle)
            charts["weekly_frequency"] = self.chart_service.create_quickchart_url(config=frequency_config)
            
            bundle.chart_urls = charts
            
            bundle.top_performers.strength = top_strength
            bundle.top_performers.volume = top_volume
            
            return charts
            
        except Exception as e:
            logger.error(f"Error generating charts: {str(e)}")
            return {}