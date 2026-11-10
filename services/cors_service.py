from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS: List[str] = [
    "*",
    "http://localhost:3000",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "https://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

ALLOW_ORIGIN_REGEX: str = r"^https?://.*:(3000|5173|8000|5050)$"

def setup_cors(app: FastAPI) -> None:
    """
    Sets up CORS middleware following Care Guide Interview configuration.
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=ALLOW_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )

