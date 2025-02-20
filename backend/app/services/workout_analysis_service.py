from typing import AsyncGenerator, Dict, Any
import logging

from langchain_anthropic import ChatAnthropic
from app.services.workout_analysis.graph_service import WorkoutGraphService
from app.services.chains.workout_analysis_chain import WorkoutAnalysisChain
from app.core.supabase.client import SupabaseClient

logger = logging.getLogger(__name__)

class WorkoutAnalysisService:
    """
    Service that coordinates workout data analysis through both graph generation
    and conversational analysis.
    """
    
    def __init__(self, llm: ChatAnthropic, supabase_client: SupabaseClient):
        self.graph_service = WorkoutGraphService(supabase_client)
        self.llm = llm

    # In workout_analysis_service.py
    async def process_query(
        self,
        user_id: str,
        message: str,
        generate_graph: bool = False,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        try:
            logger.info("="*50)
            logger.info("Starting new query processing:")
            logger.info(f"User ID: {user_id}")
            logger.info(f"Message: {message}")
            logger.info(f"Generate graph: {generate_graph}")
            logger.info("="*50)

            conversation_chain = WorkoutAnalysisChain(
                llm=self.llm,
                user_id=user_id
            )

            if generate_graph:
                logger.info("\nAttempting to create workout bundle...")
                bundle = await self.graph_service.create_workout_bundle(
                    user_id=user_id,
                    query_text=message
                )
                    
                if bundle:
                    logger.info("\nBundle created successfully!")
                    logger.info("-"*50)
                    logger.info(f"Bundle ID: {bundle.bundle_id}")
                    logger.info(f"Original query: {bundle.original_query}")
                    logger.info(f"Metadata: {bundle.metadata}")
                    logger.info(f"Workout data: {bundle.workout_data}")
                    logger.info("-"*50)
                    
                    logger.info("\nAttempting to add bundle to conversation chain...")
                    success = await conversation_chain.add_data_bundle(bundle)
                    logger.info(f"Bundle added to conversation: {success}")
                    
                    # Generate chart separately
                # Generate chart separately
                    logger.info("\nAttempting to generate chart...")
                    chart_url = await self.graph_service.add_chart_to_bundle(
                        bundle=bundle,
                        llm=self.llm
                    )
                    
                    if chart_url:
                        logger.info(f"Chart generated successfully: {chart_url}")
                        bundle.chart_url = chart_url
                        yield {
                            "type": "graph",
                            "data": {"url": chart_url}
                        }
                    else:
                        logger.error("Failed to generate chart")
                        yield {
                            "type": "error",
                            "data": "Failed to generate graph visualization"
                        }
                else:
                    logger.error("Failed to create workout bundle")
                    yield {
                        "type": "error",
                        "data": "Failed to retrieve workout data"
                    }
            # Process message with data already in context
            logger.info("\nProcessing message with conversation chain...")
            async for response in conversation_chain.process_message(message):
                yield response

        except Exception as e:
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            yield {
                "type": "error",
                "data": "An error occurred processing your request"
            }