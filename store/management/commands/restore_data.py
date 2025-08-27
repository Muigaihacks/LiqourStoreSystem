"""
Django management command for restoring data from backups
"""
import os
import json
import zipfile
from datetime import datetime
from django.core.management.base import BaseCommand
from django.core import serializers
from django.db import transaction
from django.conf import settings
from store.models import Category, Product, Inventory, StockMovement, Sale, Customer, PointTransaction


class Command(BaseCommand):
    help = 'Restore store data from a backup file'

    def add_arguments(self, parser):
        parser.add_argument(
            'backup_file',
            type=str,
            help='Path to the backup file (.json or .zip)'
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing data before restore (DANGEROUS!)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be restored without actually doing it'
        )

    def handle(self, *args, **options):
        backup_file = options['backup_file']
        clear_existing = options['clear_existing']
        dry_run = options['dry_run']
        
        if not os.path.exists(backup_file):
            self.stdout.write(
                self.style.ERROR(f'Backup file not found: {backup_file}')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )
        
        if clear_existing and not dry_run:
            self.confirm_clear_data()
        
        if backup_file.endswith('.zip'):
            self.restore_from_archive(backup_file, clear_existing, dry_run)
        elif backup_file.endswith('.json'):
            self.restore_from_json(backup_file, clear_existing, dry_run)
        else:
            self.stdout.write(
                self.style.ERROR('Unsupported backup format. Use .json or .zip files.')
            )

    def confirm_clear_data(self):
        """Confirm data clearing with user"""
        self.stdout.write(
            self.style.WARNING(
                'WARNING: This will delete ALL existing data in the database!'
            )
        )
        confirm = input('Type "yes" to confirm: ')
        if confirm.lower() != 'yes':
            self.stdout.write('Operation cancelled.')
            exit(1)

    def restore_from_archive(self, archive_path, clear_existing, dry_run):
        """Restore from ZIP archive"""
        with zipfile.ZipFile(archive_path, 'r') as zipf:
            # Find JSON backup file in archive
            json_files = [f for f in zipf.namelist() if f.endswith('.json')]
            if not json_files:
                self.stdout.write(
                    self.style.ERROR('No JSON backup file found in archive')
                )
                return
            
            # Extract and restore JSON file
            json_file = json_files[0]
            with zipf.open(json_file) as f:
                backup_data = json.load(f)
                self.restore_json_data(backup_data, clear_existing, dry_run)
            
            # Restore media files if present
            media_files = [f for f in zipf.namelist() if f.startswith('media/')]
            if media_files and not dry_run:
                self.restore_media_files(zipf, media_files)

    def restore_from_json(self, json_file, clear_existing, dry_run):
        """Restore from JSON file"""
        with open(json_file, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
            self.restore_json_data(backup_data, clear_existing, dry_run)

    def restore_json_data(self, backup_data, clear_existing, dry_run):
        """Restore data from JSON backup"""
        metadata = backup_data.get('metadata', {})
        data = backup_data.get('data', {})
        
        self.stdout.write(f'Backup created: {metadata.get("created_at", "Unknown")}')
        self.stdout.write(f'Models in backup: {", ".join(metadata.get("models_included", []))}')
        
        if dry_run:
            for model_name, records in data.items():
                self.stdout.write(f'Would restore {len(records)} {model_name} records')
            return
        
        with transaction.atomic():
            if clear_existing:
                self.clear_existing_data()
            
            # Restore data in correct order (respecting foreign key dependencies)
            restore_order = [
                'categories',
                'products', 
                'inventory',
                'customers',
                'sales',
                'stock_movements',
                'point_transactions'
            ]
            
            for model_name in restore_order:
                if model_name in data:
                    records = data[model_name]
                    self.restore_model_data(model_name, records)

    def clear_existing_data(self):
        """Clear existing data in correct order"""
        self.stdout.write('Clearing existing data...')
        
        # Clear in reverse dependency order
        models_to_clear = [
            PointTransaction,
            StockMovement,
            Sale,
            Inventory,
            Customer,
            Product,
            Category,
        ]
        
        for model in models_to_clear:
            count = model.objects.count()
            model.objects.all().delete()
            self.stdout.write(f'  ✓ Cleared {count} {model.__name__} records')

    def restore_model_data(self, model_name, records):
        """Restore data for a specific model"""
        self.stdout.write(f'Restoring {model_name}...')
        
        try:
            # Convert back to Django serializer format
            serialized_data = json.dumps(records)
            
            # Deserialize and save
            objects = serializers.deserialize('json', serialized_data)
            restored_count = 0
            
            for obj in objects:
                obj.save()
                restored_count += 1
            
            self.stdout.write(f'  ✓ Restored {restored_count} {model_name} records')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ✗ Failed to restore {model_name}: {str(e)}')
            )

    def restore_media_files(self, zipf, media_files):
        """Restore media files from archive"""
        if not hasattr(settings, 'MEDIA_ROOT'):
            self.stdout.write('MEDIA_ROOT not configured, skipping media files')
            return
        
        media_root = settings.MEDIA_ROOT
        if not os.path.exists(media_root):
            os.makedirs(media_root)
        
        self.stdout.write('Restoring media files...')
        
        for media_file in media_files:
            # Remove 'media/' prefix from archive path
            relative_path = media_file[6:]  # Remove 'media/'
            target_path = os.path.join(media_root, relative_path)
            
            # Create directory if it doesn't exist
            target_dir = os.path.dirname(target_path)
            if not os.path.exists(target_dir):
                os.makedirs(target_dir)
            
            # Extract file
            with zipf.open(media_file) as source, open(target_path, 'wb') as target:
                target.write(source.read())
        
        self.stdout.write(f'  ✓ Restored {len(media_files)} media files')
