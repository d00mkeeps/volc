# from typing import Dict, List, Any
# import logging

# logger = logging.getLogger(__name__)

# class MetricsProcessor:
#    def __init__(self, workout_data: Dict[str, Any]):
#        self.workout_data = workout_data

#    def process(self) -> Dict[str, Any]:
#        """Process workout data and calculate metrics."""
#        try:
#            workouts = self.workout_data.get('workouts', [])
#            if not workouts:
#                return self._empty_metrics()

#            all_exercises = []
#            for workout in workouts:
#                for exercise in workout.get('exercises', []):
#                    all_exercises.append(exercise)

#            exercise_metrics = {}
#            for exercise in all_exercises:
#                exercise_name = exercise.get('exercise_name', '')
#                if exercise_name and exercise_name not in exercise_metrics:
#                    exercise_metrics[exercise_name] = self._calculate_exercise_metrics(exercise)

#            return {
#                'total_workouts': len(workouts),
#                'total_exercises': len(all_exercises),
#                'exercise_metrics': exercise_metrics,
#                'overall_metrics': self._calculate_overall_metrics(all_exercises)
#            }

#        except Exception as e:
#            logger.error(f"Error processing metrics: {e}")
#            return self._empty_metrics()

#    def _calculate_exercise_metrics(self, exercise: Dict) -> Dict:
#        """Calculate metrics for a single exercise."""
#        sets = exercise.get('sets', [])
       
#        # Filter out null values
#        weights = [s.get('weight') for s in sets if s.get('weight') is not None]
#        reps = [s.get('reps') for s in sets if s.get('reps') is not None]
       
#        # Calculate volume (weight × reps) for sets with both values
#        volumes = []
#        for s in sets:
#            weight = s.get('weight')
#            rep = s.get('reps')
#            if weight is not None and rep is not None:
#                volumes.append(weight * rep)

#        return {
#            'total_sets': len(sets),
#            'max_weight': max(weights) if weights else 0,
#            'min_weight': min(weights) if weights else 0,
#            'avg_weight': sum(weights) / len(weights) if weights else 0,
#            'max_reps': max(reps) if reps else 0,
#            'min_reps': min(reps) if reps else 0,
#            'avg_reps': sum(reps) / len(reps) if reps else 0,
#            'total_volume': sum(volumes),
#            'avg_volume_per_set': sum(volumes) / len(volumes) if volumes else 0
#        }

#    def _calculate_overall_metrics(self, all_exercises: List[Dict]) -> Dict:
#        """Calculate overall metrics across all exercises."""
#        all_weights = []
#        all_reps = []
#        all_volumes = []
       
#        for exercise in all_exercises:
#            for s in exercise.get('sets', []):
#                weight = s.get('weight')
#                rep = s.get('reps')
               
#                if weight is not None:
#                    all_weights.append(weight)
#                if rep is not None:
#                    all_reps.append(rep)
#                if weight is not None and rep is not None:
#                    all_volumes.append(weight * rep)

#        return {
#            'total_sets_all_exercises': sum(len(ex.get('sets', [])) for ex in all_exercises),
#            'max_weight_overall': max(all_weights) if all_weights else 0,
#            'avg_weight_overall': sum(all_weights) / len(all_weights) if all_weights else 0,
#            'max_reps_overall': max(all_reps) if all_reps else 0,
#            'avg_reps_overall': sum(all_reps) / len(all_reps) if all_reps else 0,
#            'total_volume_overall': sum(all_volumes)
#        }

#    def _empty_metrics(self) -> Dict:
#        """Return empty metrics structure."""
#        return {
#            'total_workouts': 0,
#            'total_exercises': 0,
#            'exercise_metrics': {},
#            'overall_metrics': {
#                'total_sets_all_exercises': 0,
#                'max_weight_overall': 0,
#                'avg_weight_overall': 0,
#                'max_reps_overall': 0,
#                'avg_reps_overall': 0,
#                'total_volume_overall': 0
#            }
#        }