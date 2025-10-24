"""
One-time script to backfill estimated_1rm for existing workout_exercise_sets.
Run this after adding the estimated_1rm column to the database.
"""
import asyncio
import logging
from app.utils.one_rm_calc import OneRMCalculator
from app.core.supabase.client import supabase_factory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def backfill_e1rm():
    """
    Backfill estimated_1rm for all existing sets that have weight and reps.
    """

    try:
        admin_client = supabase_factory.get_admin_client()  # ✅ Call directly        
        # Fetch all sets with weight and reps but no e1rm
        logger.info("Fetching sets that need e1rm calculation...")
        response = admin_client.table('workout_exercise_sets')\
            .select('id, weight, reps')\
            .not_.is_('weight', 'null')\
            .not_.is_('reps', 'null')\
            .is_('estimated_1rm', 'null')\
            .execute()
        
        sets = response.data
        total = len(sets)
        logger.info(f"Found {total} sets to backfill")
        
        if total == 0:
            logger.info("No sets need backfilling. Done!")
            return
        
        # Process in batches
        batch_size = 100
        updated = 0
        failed = 0
        
        for i in range(0, total, batch_size):
            batch = sets[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(total + batch_size - 1)//batch_size}")
            
            for set_data in batch:
                try:
                    # Calculate e1rm
                    e1rm = OneRMCalculator.calculate(
                        weight=float(set_data['weight']),
                        reps=int(set_data['reps'])
                    )
                    
                    if e1rm is not None:
                        # Update the set
                        admin_client.table('workout_exercise_sets')\
                            .update({'estimated_1rm': e1rm})\
                            .eq('id', set_data['id'])\
                            .execute()
                        updated += 1
                    else:
                        logger.warning(f"Could not calculate e1rm for set {set_data['id']}")
                        failed += 1
                        
                except Exception as e:
                    logger.error(f"Error processing set {set_data['id']}: {str(e)}")
                    failed += 1
            
            logger.info(f"Batch complete. Updated: {updated}, Failed: {failed}")
        
        logger.info(f"✅ Backfill complete! Updated: {updated}, Failed: {failed}")
        
    except Exception as e:
        logger.error(f"💥 Critical error during backfill: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    asyncio.run(backfill_e1rm())