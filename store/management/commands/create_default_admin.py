"""
Django management command to create a default admin user.
This command creates a superuser with default credentials if no users exist.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates a default admin user if no users exist in the database.'

    def handle(self, *args, **options):
        # Check if any users exist
        if User.objects.exists():
            self.stdout.write(self.style.WARNING('Users already exist. Skipping default admin creation.'))
            return

        # Default credentials
        username = 'admin'
        email = 'admin@liquorstore.com'
        password = 'admin123'

        try:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created default admin user: {username}\n'
                    f'Email: {email}\n'
                    f'Password: {password}'
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating default admin: {e}'))

