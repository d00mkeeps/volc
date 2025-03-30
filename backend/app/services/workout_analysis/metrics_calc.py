from typing import Dict, List, Any
from datetime import datetime

class BaseMetricsCalculator:
    def __init__(self, workout_data: Dict):
        self.workout_data = workout_data
        self.metrics = {}
    
    def calculate(self) -> Dict:
        """Calculate metrics and return results"""
        raise NotImplementedError

class PerformanceMetricsCalculator(BaseMetricsCalculator):
    def calculate(self) -> Dict:
        """Calculate performance metrics for each exercise"""
        exercise_metrics = {}
        
        for workout in self.workout_data.get('workouts', []):
            for exercise in workout.get('exercises', []):
                # Check if 'name' exists instead of 'exercise_name'
                name = exercise.get('name', exercise.get('exercise_name', 'Unknown Exercise'))
                if name not in exercise_metrics:
                    exercise_metrics[name] = []
                
                # Extract metrics for this session
                metrics = {
                    'date': workout.get('date', ''),
                    'max_weight': max([s.get('weight', 0) or 0 for s in exercise.get('sets', [])]),
                    'total_volume': exercise.get('metrics', {}).get('total_volume', 0),
                    'total_sets': exercise.get('metrics', {}).get('total_sets', 0)
                }
                
                exercise_metrics[name].append(metrics)
        
        # Calculate progression metrics
        progression_data = {}
        
        for name, sessions in exercise_metrics.items():
            if len(sessions) < 2:
                continue
                
            # Sort by date
            sessions.sort(key=lambda x: x['date'])
            
            # Calculate progression metrics
            start_weight = sessions[0]['max_weight']
            current_weight = sessions[-1]['max_weight']
            
            # Calculate weekly volume trend
            volume_trend = self._calculate_trend([s['total_volume'] for s in sessions])
            
            # Calculate weight progression
            if start_weight > 0:
                weight_change = current_weight - start_weight
                weight_change_pct = (weight_change / start_weight) * 100
            else:
                weight_change = 0
                weight_change_pct = 0
            
            progression_data[name] = {
                'occurrences': len(sessions),
                'first_date': sessions[0]['date'],
                'last_date': sessions[-1]['date'],
                'weight_progression': {
                    'start': start_weight,
                    'current': current_weight,
                    'change': round(weight_change, 2),
                    'change_percent': round(weight_change_pct, 1)
                },
                'volume_trend': volume_trend
            }
        
        return {'exercise_progression': progression_data}
    
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate the trend direction from a list of values"""
        if not values or len(values) < 2:
            return "neutral"
            
        # Simple linear trend analysis
        start, end = values[0], values[-1]
        if end > start * 1.05:  # 5% increase
            return "increasing"
        elif end < start * 0.95:  # 5% decrease
            return "decreasing"
        else:
            return "stable"

class StrengthMetricsCalculator(BaseMetricsCalculator):
    def calculate(self) -> Dict:
        """Calculate strength metrics based on 1RM estimates"""
        exercise_1rm = {}
        
        for workout in self.workout_data.get('workouts', []):
            for exercise in workout.get('exercises', []):
                # Check if 'name' exists instead of 'exercise_name'
                name = exercise.get('name', exercise.get('exercise_name', 'Unknown Exercise'))
                if name not in exercise_1rm:
                    exercise_1rm[name] = []
                
                # Get highest estimated 1RM for this session
                highest_1rm = max([s.get('estimated_1rm', 0) or 0 for s in exercise.get('sets', [])])
                
                if highest_1rm > 0:
                    exercise_1rm[name].append({
                        'date': workout.get('date', ''),
                        'estimated_1rm': highest_1rm
                    })
        
        # Calculate strength progression
        strength_data = {}
        most_improved = []
        
        for name, sessions in exercise_1rm.items():
            if len(sessions) < 2:
                continue
                
            # Sort by date
            sessions.sort(key=lambda x: x['date'])
            
            # Calculate 1RM progression
            start_1rm = sessions[0]['estimated_1rm']
            current_1rm = sessions[-1]['estimated_1rm']
            
            # Calculate change
            rm_change = current_1rm - start_1rm
            rm_change_pct = (rm_change / start_1rm) * 100 if start_1rm > 0 else 0
            
            # Calculate rate of progress (per month)
            try:
                start_date = datetime.fromisoformat(sessions[0]['date'].replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(sessions[-1]['date'].replace('Z', '+00:00'))
                days = (end_date - start_date).days
                if days > 0:
                    monthly_rate = (rm_change / days) * 30
                else:
                    monthly_rate = 0
            except (ValueError, TypeError):
                monthly_rate = 0
            
            strength_data[name] = {
                'estimated_1rm': {
                    'start': round(start_1rm, 1),
                    'current': round(current_1rm, 1),
                    'change': round(rm_change, 1),
                    'change_percent': round(rm_change_pct, 1),
                    'monthly_rate': round(monthly_rate, 1)
                }
            }
            
            # Track for most improved
            most_improved.append({
                'name': name,
                'improvement': rm_change_pct
            })
        
        # Sort and limit most improved
        most_improved.sort(key=lambda x: x['improvement'], reverse=True)
        top_improved = most_improved[:3]
        
        return {
            'strength_progression': strength_data,
            'most_improved_exercises': top_improved
        }

class WorkoutFrequencyCalculator(BaseMetricsCalculator):
    def calculate(self) -> Dict:
        """Calculate workout frequency and consistency metrics"""
        workouts = self.workout_data.get('workouts', [])
        
        if not workouts:
            return {'workout_frequency': {'total_workouts': 0}}
        
        # Extract dates and convert to datetime objects
        dates = []
        for workout in workouts:
            date_str = workout.get('date', '')
            if not date_str:
                continue
                
            try:
                date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                dates.append(date)
            except (ValueError, TypeError):
                # Skip invalid dates
                continue
        
        if not dates:
            return {'workout_frequency': {'total_workouts': 0}}
        
        # Sort dates
        dates.sort()
        
        # Calculate metrics
        first_date = dates[0]
        last_date = dates[-1]
        total_days = (last_date - first_date).days + 1  # Include both start and end days
        
        # Calculate days between workouts
        intervals = []
        for i in range(1, len(dates)):
            interval = (dates[i] - dates[i-1]).days
            intervals.append(interval)
        
        # Calculate metrics
        avg_interval = sum(intervals) / len(intervals) if intervals else 0
        workouts_per_week = 7 / avg_interval if avg_interval > 0 else 0
        total_weeks = total_days / 7
        
        return {
            'workout_frequency': {
                'total_workouts': len(dates),
                'first_workout': first_date.strftime('%Y-%m-%d'),
                'last_workout': last_date.strftime('%Y-%m-%d'),
                'total_days': total_days,
                'avg_days_between': round(avg_interval, 1),
                'workouts_per_week': round(workouts_per_week, 1),
                'consistency_score': self._calculate_consistency(intervals)
            }
        }
    
    def _calculate_consistency(self, intervals: List[int]) -> int:
        """Calculate a consistency score based on workout intervals"""
        if not intervals:
            return 0
        
        # Calculate coefficient of variation (lower is more consistent)
        mean = sum(intervals) / len(intervals)
        variance = sum((x - mean) ** 2 for x in intervals) / len(intervals)
        std_dev = variance ** 0.5
        cv = (std_dev / mean) if mean > 0 else float('inf')
        
        # Convert to a 0-100 score (0 is inconsistent, 100 is perfect consistency)
        # Cap CV at 1.0 for scoring purposes
        capped_cv = min(cv, 1.0)
        score = 100 * (1 - capped_cv)
        
        return round(score)

class MetricsProcessor:
    def __init__(self, workout_data: Dict):
        self.workout_data = workout_data
        self.calculators = [
            PerformanceMetricsCalculator(workout_data),
            StrengthMetricsCalculator(workout_data),
            WorkoutFrequencyCalculator(workout_data)
        ]
    
    def process(self) -> Dict:
        """Process all metrics and return combined results"""
        combined_metrics = {}
        
        for calculator in self.calculators:
            metrics = calculator.calculate()
            combined_metrics.update(metrics)
        
        return combined_metrics