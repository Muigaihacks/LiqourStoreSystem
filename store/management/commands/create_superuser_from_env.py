"""
Management command to create superuser from environment variables.
This is useful for Render free tier where shell access is not available.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates a superuser from environment variables (ADMIN_* or TEMP_ADMIN_* for tenant bootstrap).'

    def handle(self, *args, **options):
        # Support TEMP_ADMIN_* for tenant bootstrap (owner first login); fall back to ADMIN_*
        admin_username = os.environ.get('TEMP_ADMIN_USERNAME') or os.environ.get('ADMIN_USERNAME', 'admin')
        admin_email = os.environ.get('TEMP_ADMIN_EMAIL') or os.environ.get('ADMIN_EMAIL', 'admin@liquorstore.com')
        admin_password = os.environ.get('TEMP_ADMIN_PASSWORD') or os.environ.get('ADMIN_PASSWORD', 'admin123')

        # Check if user already exists
        if User.objects.filter(username=admin_username).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'User "{admin_username}" already exists. Skipping.'
                )
            )
            return

        User.objects.create_superuser(
            username=admin_username,
            email=admin_email,
            password=admin_password
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created superuser "{admin_username}"'
            )
        )

