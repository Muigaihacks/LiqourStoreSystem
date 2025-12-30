release: python manage.py migrate --noinput --settings=liquor_store_backend.settings_production && python manage.py create_superuser_from_env --settings=liquor_store_backend.settings_production || true
web: gunicorn liquor_store_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120

