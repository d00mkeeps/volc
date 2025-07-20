# # app/services/job_store.py
# import time
# import asyncio
# import logging
# from typing import Dict, Any, Optional
# import uuid

# logger = logging.getLogger(__name__)

# class JobStore:
#     """Generic in-memory job store with automatic cleanup after 15 minutes"""
    
#     def __init__(self):
#         self.jobs = {}
#         self.cleanup_task = None
        
#     async def start_cleanup_task(self):
#         """Start the background cleanup task"""
#         if self.cleanup_task is None:
#             self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
#     async def _cleanup_loop(self):
#         """Periodically clean up old jobs"""
#         while True:
#             try:
#                 self._cleanup_expired_jobs()
#             except Exception as e:
#                 logger.error(f"Error in job cleanup: {str(e)}")
#             await asyncio.sleep(60)  # Check every minute
            
#     def _cleanup_expired_jobs(self):
#         """Remove jobs that are older than 15 minutes"""
#         now = time.time()
#         expired_jobs = []
        
#         for job_id, job in list(self.jobs.items()):
#             # Clean up completed or failed jobs after 15 minutes
#             if job["status"] in ["completed", "failed"]:
#                 if now - job.get("completed_at", now) > 900:  # 15 minutes = 900 seconds
#                     expired_jobs.append(job_id)
        
#         # Remove expired jobs
#         for job_id in expired_jobs:
#             self.jobs.pop(job_id, None)
            
#         if expired_jobs:
#             logger.info(f"Cleaned up {len(expired_jobs)} expired jobs")
    
#     def create_job(self, job_type: str, user_id: str, parameters: Dict[str, Any]) -> str:
#         """Create a new job and return its ID"""
#         job_id = str(uuid.uuid4())
        
#         self.jobs[job_id] = {
#             "job_id": job_id,
#             "job_type": job_type,
#             "user_id": user_id,
#             "parameters": parameters,
#             "status": "pending",
#             "created_at": time.time(),
#             "progress": 0,
#             "result": None,
#             "error": None,
#             "status_message": "Job created"
#         }
        
#         return job_id
        
#     def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
#         """Get job by ID"""
#         return self.jobs.get(job_id)
            
#     def update_job(self, job_id: str, updates: Dict[str, Any]) -> bool:
#         """Update job with new data"""
#         if job_id not in self.jobs:
#             return False
            
#         self.jobs[job_id].update(updates)
        
#         # If job is being marked as completed or failed, set completed timestamp
#         if updates.get("status") in ["completed", "failed"]:
#             self.jobs[job_id]["completed_at"] = time.time()
            
#         return True

# # Create singleton instance
# job_store = JobStore()