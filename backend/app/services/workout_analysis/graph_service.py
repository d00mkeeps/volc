from typing import Optional
from datetime import datetime
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

            # Create bundle with correlation data
            bundle = WorkoutDataBundle(
                bundle_id=bundle_id,
                metadata=metadata,
                workout_data=formatted_data,
                original_query=query_text,
                chart_url=None,  # No chart URL yet
                correlation_data=CorrelationData(**correlation_results) if correlation_results else None,
                created_at=datetime.now()
            )
            
            return bundle

        except Exception as e:
            logger.error(f"Error creating workout bundle: {str(e)}", exc_info=True)
            return None

    async def add_chart_to_bundle(self, bundle: WorkoutDataBundle, llm) -> Optional[str]:
        """
        Generates a chart for an existing workout bundle and returns the URL.
        """
        try:
            # Generate chart configuration
            chart_config = await generate_chart_config(
                workouts=bundle.workout_data,
                original_query=bundle.original_query,
                llm=llm
            )
            
            # Create chart URL
            return self.chart_service.create_quickchart_url(config=chart_config)

        except Exception as e:
            logger.error(f"Error generating chart: {str(e)}")
            return None