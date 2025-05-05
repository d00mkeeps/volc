from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.supabase.errors import APIError
from app.api.endpoints.llm import router as llm_router
from app.api.endpoints.db import router as db_router
from app.api.endpoints.auth import router as auth_router 
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

# Add exception handler for custom API errors
@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Updated path to remove redundant /api/llm/ws prefix
app.include_router(llm_router, tags=["llm"])
app.include_router(db_router, tags=["db"])
app.include_router(auth_router, tags=["auth"])