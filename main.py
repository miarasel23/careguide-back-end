import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from core.config import settings
from core.database import init_database_indexes, is_in_memory_db
from modules.apiResponse.custom_error_handler import (
    custom_http_exception_handler,
    validation_exception_handler,
)
from modules.apiResponse.response import custom_response
from modules.apiResponse.error_code import ApiResponseCode
from services.cors_service import setup_cors
from seeds.seeder import run_seeders

# Router imports
from modules.user.user_routers import auth_route, admin_users_route
from modules.note.note_routers import note_router
from modules.post.post_routers import post_router
from modules.aggregation.aggregation_routers import aggregation_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize indexes and run seeders
    logger.info("[Startup] Booting Secure Note-Taking REST API (Care Guide Interview Pattern)...")
    init_database_indexes()
    run_seeders()
    logger.info("[Startup] Application ready to accept requests.")
    yield
    # Shutdown
    logger.info("[Shutdown] Application terminating...")

# ──────────────────────────────────────────────
# Application Initialization & Middleware
# ──────────────────────────────────────────────
app = FastAPI(
    title="Secure Note-Taking REST API",
    description="Secure Note-Taking Platform with RBAC, MongoDB Aggregations, and Optimized Indexing following Care Guide Interview Architecture",
    version="1.0.0",
    lifespan=lifespan
)

# Apply CORS & Access Policy (services/cors_service.py)
setup_cors(app)

# Custom Error Handlers (Care Guide Interview pattern)
app.add_exception_handler(HTTPException, custom_http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# ──────────────────────────────────────────────
# Health Check Endpoint
# ──────────────────────────────────────────────
@app.get("/health")
def health_check():
    return custom_response(
        status_code=ApiResponseCode.ALLOWED_HTTP_COD["ok"],
        message="API is healthy and operational.",
        data={
            "service": "Secure Note-Taking REST API",
            "architecture": "Care Guide Interview Modular Domain Architecture (Python FastAPI)",
            "database": "In-Memory Engine (mongomock)" if is_in_memory_db() else "MongoDB Native",
            "version": "1.0.0"
        }
    )

# ──────────────────────────────────────────────
# Mount Domain Routers (Prefix: /api/v1)
# ──────────────────────────────────────────────
app.include_router(auth_route.router)
app.include_router(admin_users_route.router)
app.include_router(note_router.router)
app.include_router(post_router.router)
app.include_router(aggregation_router.router)

# ──────────────────────────────────────────────
# Serve Built React Frontend (if built)
# ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.abspath(os.path.join(BASE_DIR, "..", "interview-font-end", "dist"))
FRONTEND_ASSETS = os.path.join(FRONTEND_DIST, "assets")

if os.path.exists(FRONTEND_ASSETS):
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS), name="static_assets")

    @app.get("/")
    async def serve_root():
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Frontend build not found. Run npm run build in interview-font-end."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
