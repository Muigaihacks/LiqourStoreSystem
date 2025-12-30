release: python manage.py migrate --noinput && python manage.py create_superuser_from_env || true
web: gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120

