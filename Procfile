release: python manage.py migrate --noinput || true
web: gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120

