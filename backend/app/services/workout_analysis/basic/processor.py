from typing import Dict, Any
import logging
from datetime import datetime
from ..schemas import (
    WorkoutDataBundle, BundleMetadata, TopPerformers, ConsistencyMetrics
)
from ..calc.strength import StrengthCalculator
from ..calc.volume import VolumeCalculator
from ..calc.consistency import ConsistencyCalculator

logger = logging.getLogger(__name__)

class BasicBundleProcessor:
    """
    Processes workout data into basic analysis bundles.
    
    Basic bundles include:
    - Top performers (strength/volume gains)
    - Consistency metrics
    - Short-term trends (via time series)
    - Recent workout history (lean format)
    
    Excludes advanced features like correlation analysis.
    """
    
    def process(self, bundle_id: str, user_id: str, raw_workout_data: Dict) -> WorkoutDataBundle:
        """Process raw workout data into a basic analysis bundle."""
        logger.info(f"Processing basic bundle {bundle_id} with {len(raw_workout_data.get('workouts', []))} workouts")
        
        errors = []
        
        try:
            # 1. Calculate strength metrics and time series
            strength_results = self._calculate_strength(raw_workout_data, errors)
            
            # 2. Calculate volume metrics and time series  
            volume_results = self._calculate_volume(raw_workout_data, errors)
            
            # 3. Calculate consistency metrics
            consistency_results = self._calculate_consistency(raw_workout_data, errors)
            
            # 4. Skip correlation analysis for basic bundles
            # (Advanced bundles will include this)
            
            # 5. Create lean workouts (drop heavy raw data)
            lean_workouts = self._create_lean_workouts(raw_workout_data)
            
            # 6. Generate metadata
            metadata = self._create_metadata(raw_workout_data, errors)
            
            # 7. Assemble final bundle
            bundle = self._assemble_bundle(
                bundle_id=bundle_id,
                user_id=user_id,
                metadata=metadata,
                lean_workouts=lean_workouts,
                strength_results=strength_results,
                volume_results=volume_results,
                consistency_results=consistency_results
            )
            
            logger.info(f"Successfully processed basic bundle {bundle_id}")
            return bundle
            
        except Exception as e:
            logger.error(f"Critical error processing basic bundle {bundle_id}: {e}", exc_info=True)
            errors.append(f"Processing failed: {str(e)}")
            return self._create_failed_bundle(bundle_id, user_id, raw_workout_data, errors)
    
    def _calculate_strength(self, raw_workout_data: Dict, errors: list):
        """Calculate strength metrics with error handling."""
        try:
            return StrengthCalculator.calculate(raw_workout_data, limit=5)  # Top 5 for basic
        except Exception as e:
            logger.error(f"Strength calculation failed: {e}", exc_info=True)
            errors.append(f"Strength analysis failed: {str(e)}")
            from ..schemas import StrengthCalculatorResult
            return StrengthCalculatorResult(top_performers=[], time_series={})
    
    def _calculate_volume(self, raw_workout_data: Dict, errors: list):
        """Calculate volume metrics with error handling."""
        try:
            return VolumeCalculator.calculate(raw_workout_data, limit=5)  # Top 5 for basic
        except Exception as e:
            logger.error(f"Volume calculation failed: {e}", exc_info=True)
            errors.append(f"Volume analysis failed: {str(e)}")
            from ..schemas import VolumeCalculatorResult
            return VolumeCalculatorResult(top_performers=[], time_series={})
    
    def _calculate_consistency(self, raw_workout_data: Dict, errors: list) -> ConsistencyMetrics:
        """Calculate consistency metrics with error handling."""
        try:
            return ConsistencyCalculator.calculate(raw_workout_data)
        except Exception as e:
            logger.error(f"Consistency calculation failed: {e}", exc_info=True)
            errors.append(f"Consistency analysis failed: {str(e)}")
            return ConsistencyMetrics(avg_gap=0.0, variance=None)
    
    def _create_lean_workouts(self, raw_workout_data: Dict) -> Dict[str, Any]:
        """Extract only essential workout info for LLM context."""
        lean_workouts = []
        
        for workout in raw_workout_data.get("workouts", []):
            lean_workouts.append({
                "name": workout.get("name", ""),
                "date": workout.get("created_at", "")[:10] if workout.get("created_at") else workout.get("date", "")[:10] if workout.get("date") else "",
                "notes": workout.get("notes", "")
            })
        
        return {"workouts": lean_workouts}
    
    def _create_metadata(self, raw_workout_data: Dict, errors: list) -> BundleMetadata:
        """Create bundle metadata from raw data and errors."""
        metadata_from_query = raw_workout_data.get('metadata', {})
        
        return BundleMetadata(
            total_workouts=metadata_from_query.get('total_workouts', 0),
            total_exercises=metadata_from_query.get('total_exercises', 0),
            date_range=metadata_from_query.get('date_range', {}),
            exercises_included=metadata_from_query.get('exercises_included', []),
            errors=errors
        )
    
    def _assemble_bundle(self, bundle_id: str, user_id: str, metadata: BundleMetadata, 
                        lean_workouts: Dict, strength_results, volume_results, 
                        consistency_results: ConsistencyMetrics) -> WorkoutDataBundle:
        """Assemble the final basic bundle."""
        
        # Convert calculator results to bundle format
        top_performers = TopPerformers(
            strength=[tp.model_dump() for tp in strength_results.top_performers],
            volume=[tp.model_dump() for tp in volume_results.top_performers],
            frequency=[]  # Basic bundles don't include frequency performers
        )
        
        return WorkoutDataBundle(
            id=bundle_id,
            metadata=metadata,
            workouts=lean_workouts,
            chart_urls={},  # Basic bundles don't generate charts
            top_performers=top_performers,
            consistency_metrics=consistency_results.model_dump(),
            correlation_data=None,  # No correlations in basic bundles
            status='complete',
            created_at=datetime.now()
        )
    
    def _create_failed_bundle(self, bundle_id: str, user_id: str, raw_workout_data: Dict, errors: list) -> WorkoutDataBundle:
        """Create minimal bundle when processing fails."""
        metadata = self._create_metadata(raw_workout_data, errors)
        
        return WorkoutDataBundle(
            id=bundle_id,
            metadata=metadata,
            workouts={"workouts": []},
            top_performers=TopPerformers(),
            consistency_metrics=ConsistencyMetrics(),
            correlation_data=None,
            status='failed',
            created_at=datetime.now()
        )