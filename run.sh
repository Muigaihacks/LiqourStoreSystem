#!/bin/bash
set -e  # Exit on error - this is critical!

echo "=== Starting deployment script ==="
echo "Current directory: $(pwd)"
echo "DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE}"

echo ""
echo "=== Running migrations ==="
python manage.py migrate --noinput --settings=liquor_store_backend.settings_production 2>&1

echo ""
echo "=== Creating default admin ==="
python manage.py create_default_admin --settings=liquor_store_backend.settings_production || true

echo ""
echo "=== Starting Gunicorn ==="
exec gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120

