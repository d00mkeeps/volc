from fastapi import FastAPI
from app.api.endpoints import llm_router
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


app.include_router(llm_router, prefix="/api/llm", tags=["llm"])