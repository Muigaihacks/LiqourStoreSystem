#!/bin/bash
# Startup script for Render deployment
# Runs migrations before starting Gunicorn

set -e  # Exit on error

echo "Running database migrations..."
python manage.py migrate --noinput --settings=liquor_store_backend.settings_production

echo "Creating superuser if needed..."
python manage.py create_superuser_from_env --settings=liquor_store_backend.settings_production || true

echo "Starting Gunicorn..."
exec gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120

