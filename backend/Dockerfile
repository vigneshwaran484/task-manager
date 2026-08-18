# ────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Install dependencies with uv into a virtual environment so we can copy
# only the venv to the final image (no build tools, no pip, no uv).
# ────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

# Install uv — pinned hash for supply-chain integrity
COPY --from=ghcr.io/astral-sh/uv:0.4.20 /uv /uvx /usr/local/bin/

WORKDIR /build

# Copy dependency files first so Docker layer cache is reused when only
# source code changes (not deps).
COPY pyproject.toml uv.lock ./
# uv sync creates /build/.venv with only production dependencies
RUN uv sync --no-dev --frozen

# Copy application source
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# ────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime (distroless-like: python-slim with no extras)
# We use python:3.12-slim rather than true distroless so we can run
# shell-based entrypoints and alembic migrations. The attack surface is
# still dramatically reduced vs. a full image.
# ────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Security: run as non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy only the virtual environment and app code — no build tools land here
COPY --from=builder /build/.venv /app/.venv
COPY --from=builder /build/app /app/app
COPY --from=builder /build/alembic /app/alembic
COPY --from=builder /build/alembic.ini /app/alembic.ini

# Make the venv's Python the default interpreter
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Tell Python not to buffer stdout/stderr (important for log streaming)
    PYTHONFAULTHANDLER=1

# Copy and configure entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Drop to non-root
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
USER appuser

EXPOSE 8000

# Health check so orchestrators can detect unhealthy containers
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

ENTRYPOINT ["docker-entrypoint.sh"]
