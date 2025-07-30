from typing import Dict, Any
import logging
from datetime import datetime
from .schemas import (
    WorkoutDataBundle, BundleMetadata, TopPerformers, ConsistencyMetrics,
    StrengthCalculatorResult, VolumeCalculatorResult, CorrelationCalculatorResult
)
from .calc.strength import StrengthCalculator
from .calc.volume import VolumeCalculator
from .calc.consistency import ConsistencyCalculator
from .calc.correlation import CorrelationCalculator

logger = logging.getLogger(__name__)

class WorkoutDataProcessor:
    """Orchestrates all calculations to build a complete workout analysis bundle."""
    
    def process(self, bundle_id: str, conversation_id: str, user_id: str, raw_workout_data: Dict) -> WorkoutDataBundle:
        """Process raw workout data into a complete, lean analysis bundle."""
        logger.info(f"Processing bundle {bundle_id} with {len(raw_workout_data.get('workouts', []))} workouts")
        
        errors = []
        
        try:
            # 1. Calculate strength metrics and time series
            strength_results = self._calculate_strength(raw_workout_data, errors)
            
            # 2. Calculate volume metrics and time series  
            volume_results = self._calculate_volume(raw_workout_data, errors)
            
            # 3. Calculate consistency metrics
            consistency_results = self._calculate_consistency(raw_workout_data, errors)
            
            # 4. Calculate correlations using time series from strength + volume
            correlation_results = self._calculate_correlations(strength_results, volume_results, errors)
            
            # 5. Create lean workouts (drop heavy raw data)
            lean_workouts = self._create_lean_workouts(raw_workout_data)
            
            # 6. Generate metadata
            metadata = self._create_metadata(raw_workout_data, errors)
            
            # 7. Assemble final bundle
            bundle = self._assemble_bundle(
                bundle_id=bundle_id,
                metadata=metadata,
                lean_workouts=lean_workouts,
                strength_results=strength_results,
                volume_results=volume_results,
                consistency_results=consistency_results,
                correlation_results=correlation_results
            )
            
            logger.info(f"Successfully processed bundle {bundle_id}")
            return bundle
            
        except Exception as e:
            logger.error(f"Critical error processing bundle {bundle_id}: {e}")
            errors.append(f"Processing failed: {str(e)}")
            return self._create_failed_bundle(bundle_id, raw_workout_data, errors)
    
    def _calculate_strength(self, raw_workout_data: Dict, errors: list) -> StrengthCalculatorResult:
        """Calculate strength metrics with error handling."""
        try:
            return StrengthCalculator.calculate(raw_workout_data, limit=3)
        except Exception as e:
            logger.error(f"Strength calculation failed: {e}")
            errors.append(f"Strength analysis failed: {str(e)}")
            return StrengthCalculatorResult(top_performers=[], time_series={})
    
    def _calculate_volume(self, raw_workout_data: Dict, errors: list) -> VolumeCalculatorResult:
        """Calculate volume metrics with error handling."""
        try:
            return VolumeCalculator.calculate(raw_workout_data, limit=3)
        except Exception as e:
            logger.error(f"Volume calculation failed: {e}")
            errors.append(f"Volume analysis failed: {str(e)}")
            return VolumeCalculatorResult(top_performers=[], time_series={})
    
    def _calculate_consistency(self, raw_workout_data: Dict, errors: list) -> ConsistencyMetrics:
        """Calculate consistency metrics with error handling."""
        try:
            return ConsistencyCalculator.calculate(raw_workout_data)
        except Exception as e:
            logger.error(f"Consistency calculation failed: {e}")
            errors.append(f"Consistency analysis failed: {str(e)}")
            return ConsistencyMetrics(avg_gap=0.0, variance=None)
    
    def _calculate_correlations(self, strength_results: StrengthCalculatorResult, 
                              volume_results: VolumeCalculatorResult, errors: list) -> CorrelationCalculatorResult:
        """Calculate correlations using time series data with error handling."""
        try:
            return CorrelationCalculator.calculate(
                strength_time_series=strength_results.time_series,
                volume_time_series=volume_results.time_series
            )
        except Exception as e:
            logger.error(f"Correlation calculation failed: {e}")
            errors.append(f"Correlation analysis failed: {str(e)}")
            return CorrelationCalculatorResult(
                significant_correlations=[],
                total_pairs_analyzed=0,
                significant_count=0,
                data_quality_notes=[f"Correlation analysis failed: {str(e)}"]
            )
    
    def _create_lean_workouts(self, raw_workout_data: Dict) -> Dict[str, Any]:
        """Extract only essential workout info for LLM context."""
        lean_workouts = []
        
        for workout in raw_workout_data.get("workouts", []):
            lean_workouts.append({
                "name": workout.get("name", ""),
                "date": workout.get("date", "")[:10] if workout.get("date") else "",
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
    
    def _assemble_bundle(self, bundle_id: str, metadata: BundleMetadata, lean_workouts: Dict,
                        strength_results: StrengthCalculatorResult, volume_results: VolumeCalculatorResult,
                        consistency_results: ConsistencyMetrics, correlation_results: CorrelationCalculatorResult) -> WorkoutDataBundle:
        """Assemble the final workout data bundle."""
        
        # Convert calculator results to bundle format
        top_performers = TopPerformers(
            strength=[tp.model_dump() for tp in strength_results.top_performers],
            volume=[tp.model_dump() for tp in volume_results.top_performers],
            frequency=[]  # TODO: Extract frequency performers from consistency if needed
        )
        
        return WorkoutDataBundle(
            id=bundle_id,
            metadata=metadata,
            workouts=lean_workouts,
            chart_urls={},  # Charts will be added later when we re-enable chart generation
            top_performers=top_performers,
            consistency_metrics=consistency_results.model_dump(),  # ← FIXED: Convert to dict
            correlation_data=correlation_results.model_dump() if correlation_results else None,  # ← FIXED: Convert to dict
            status='complete',
            created_at=datetime.now()
        )
    
    def _create_failed_bundle(self, bundle_id: str, raw_workout_data: Dict, errors: list) -> WorkoutDataBundle:
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