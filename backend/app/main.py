from fastapi import FastAPI
from app.api.endpoints import llm_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:**",
    "http://localhost:8080",
    "http://localhost:19006", 
    "exp://localhost:19000",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llm_router, prefix="/api/llm", tags=["llm"])