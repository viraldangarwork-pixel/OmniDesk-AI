from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import router as api_v1_router
from app.core.config import settings
from app.core.logging import configure_logging, logger
from app.websocket.routes import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging("DEBUG" if settings.APP_DEBUG else "INFO")
    logger.info("app.start", env=settings.APP_ENV, name=settings.APP_NAME)
    yield
    logger.info("app.stop")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS + [settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    async def health() -> JSONResponse:
        return JSONResponse({"status": "ok", "env": settings.APP_ENV})

    @app.get("/", tags=["meta"])
    async def root() -> dict[str, str]:
        return {
            "app": settings.APP_NAME,
            "version": "0.1.0",
            "docs": "/docs",
        }

    app.include_router(api_v1_router, prefix="/api/v1")
    app.include_router(ws_router)
    return app


app = create_app()
