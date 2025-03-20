from fastapi import FastAPI
from app.api.endpoints.llm import router as llm_router
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging_config import setup_logging
import logging

setup_logging()
logger = logging.getLogger(__name__)
logger.info("Application starting")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Updated path to remove redundant /api/llm/ws prefix
app.include_router(llm_router, tags=["llm"])