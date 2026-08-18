"""
FastAPI application factory.
Security middleware and headers are configured here centrally.
"""

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import auth, tasks

logger = structlog.get_logger()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Task Manager API",
        version="0.1.0",
        # Disable docs in production — reduces attack surface
        docs_url="/docs" if settings.APP_ENV == "development" else None,
        redoc_url="/redoc" if settings.APP_ENV == "development" else None,
        openapi_url="/openapi.json" if settings.APP_ENV == "development" else None,
    )

    # ── CORS ──────────────────────────────────────────────────────────────
    # Only allow the origins we explicitly trust. Wildcard (*) is forbidden
    # in production because it would allow any site to make credentialed
    # cross-origin requests to our API.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # ── Security headers middleware ────────────────────────────────────────
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )
        # CSP is set on the frontend (nginx); backend API responses don't need it
        return response

    # ── Global exception handler ───────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception", path=request.url.path, exc=str(exc))
        # Never expose internal error details to the client
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    # ── Routers ───────────────────────────────────────────────────────────
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(tasks.router, prefix="/api/v1")

    # ── Health check ──────────────────────────────────────────────────────
    @app.get("/health", tags=["ops"])
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
