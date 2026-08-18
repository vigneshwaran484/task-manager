#!/bin/sh
# docker-entrypoint.sh
# Runs Alembic migrations then starts uvicorn.
# Running migrations in the entrypoint ensures schema is always up-to-date
# before the app accepts traffic — important for rolling deployments.
set -e

echo "Running database migrations..."
python -m alembic upgrade head

echo "Starting application..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 2 \
  --proxy-headers \
  --forwarded-allow-ips="*"
