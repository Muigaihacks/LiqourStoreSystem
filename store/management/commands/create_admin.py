"""
Django management command to create a default admin user.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates a default admin user if no users exist.'

    def handle(self, *args, **options):
        # Check if any users exist
        if User.objects.exists():
            self.stdout.write(self.style.WARNING('Users already exist. Skipping admin creation.'))
            return

        # Create default admin
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
                    f'✅ Admin user created!\n'
                    f'Username: {username}\n'
                    f'Password: {password}'
                )
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating admin: {e}'))

