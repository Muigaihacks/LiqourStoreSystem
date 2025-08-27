"""
Django management command for creating data backups
"""
import os
import json
import zipfile
from datetime import datetime
from django.core.management.base import BaseCommand
from django.core import serializers
from django.conf import settings
from django.db import connection
from store.models import Category, Product, Inventory, StockMovement, Sale, Customer, PointTransaction


class Command(BaseCommand):
    help = 'Create a comprehensive backup of all store data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            default='json',
            choices=['json', 'sql'],
            help='Backup format: json or sql (default: json)'
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default='backups',
            help='Output directory for backup files (default: backups)'
        )
        parser.add_argument(
            '--include-media',
            action='store_true',
            help='Include media files in backup'
        )

    def handle(self, *args, **options):
        format_type = options['format']
        output_dir = options['output_dir']
        include_media = options['include_media']
        
        # Create backup directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Generate timestamp for backup filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f'liquor_store_backup_{timestamp}'
        
        if format_type == 'json':
            self.create_json_backup(output_dir, backup_name, include_media)
        elif format_type == 'sql':
            self.create_sql_backup(output_dir, backup_name, include_media)
        
        self.stdout.write(
            self.style.SUCCESS(f'Backup created successfully: {backup_name}')
        )

    def create_json_backup(self, output_dir, backup_name, include_media):
        """Create JSON-based backup"""
        backup_data = {
            'metadata': {
                'created_at': datetime.now().isoformat(),
                'django_version': '5.2.5',
                'backup_format': 'json',
                'models_included': [
                    'Category', 'Product', 'Inventory', 'StockMovement', 
                    'Sale', 'Customer', 'PointTransaction'
                ]
            },
            'data': {}
        }
        
        # Backup each model
        models_to_backup = [
            ('categories', Category),
            ('products', Product),
            ('inventory', Inventory),
            ('stock_movements', StockMovement),
            ('sales', Sale),
            ('customers', Customer),
            ('point_transactions', PointTransaction),
        ]
        
        for model_name, model_class in models_to_backup:
            self.stdout.write(f'Backing up {model_name}...')
            queryset = model_class.objects.all()
            serialized_data = serializers.serialize('json', queryset)
            backup_data['data'][model_name] = json.loads(serialized_data)
            self.stdout.write(f'  ✓ {queryset.count()} records backed up')
        
        # Create backup file
        backup_file = os.path.join(output_dir, f'{backup_name}.json')
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
        # Create ZIP archive if including media
        if include_media:
            self.create_backup_archive(output_dir, backup_name, backup_file, include_media)
        
        self.stdout.write(f'JSON backup saved to: {backup_file}')

    def create_sql_backup(self, output_dir, backup_name, include_media):
        """Create SQL dump backup (PostgreSQL/SQLite)"""
        db_settings = settings.DATABASES['default']
        engine = db_settings['ENGINE']
        
        backup_file = os.path.join(output_dir, f'{backup_name}.sql')
        
        if 'sqlite' in engine:
            self.create_sqlite_backup(db_settings, backup_file)
        elif 'postgresql' in engine:
            self.create_postgresql_backup(db_settings, backup_file)
        else:
            self.stdout.write(
                self.style.ERROR(f'SQL backup not supported for {engine}')
            )
            return
        
        # Create ZIP archive if including media
        if include_media:
            self.create_backup_archive(output_dir, backup_name, backup_file, include_media)
        
        self.stdout.write(f'SQL backup saved to: {backup_file}')

    def create_sqlite_backup(self, db_settings, backup_file):
        """Create SQLite backup"""
        import shutil
        db_path = db_settings['NAME']
        shutil.copy2(db_path, backup_file.replace('.sql', '.db'))
        
        # Also create SQL dump
        with connection.cursor() as cursor:
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            with open(backup_file, 'w') as f:
                f.write('-- SQLite Database Backup\n')
                f.write(f'-- Created: {datetime.now().isoformat()}\n\n')
                
                for table in tables:
                    if table[0]:  # Skip None values
                        f.write(f'{table[0]};\n\n')

    def create_postgresql_backup(self, db_settings, backup_file):
        """Create PostgreSQL backup using pg_dump"""
        import subprocess
        
        cmd = [
            'pg_dump',
            '--host', db_settings.get('HOST', 'localhost'),
            '--port', str(db_settings.get('PORT', 5432)),
            '--username', db_settings['USER'],
            '--dbname', db_settings['NAME'],
            '--file', backup_file,
            '--verbose',
            '--no-password'
        ]
        
        env = os.environ.copy()
        if db_settings.get('PASSWORD'):
            env['PGPASSWORD'] = db_settings['PASSWORD']
        
        try:
            subprocess.run(cmd, env=env, check=True, capture_output=True, text=True)
            self.stdout.write('PostgreSQL backup created successfully')
        except subprocess.CalledProcessError as e:
            self.stdout.write(
                self.style.ERROR(f'PostgreSQL backup failed: {e.stderr}')
            )

    def create_backup_archive(self, output_dir, backup_name, backup_file, include_media):
        """Create ZIP archive with backup and optional media files"""
        archive_path = os.path.join(output_dir, f'{backup_name}.zip')
        
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add backup file
            zipf.write(backup_file, os.path.basename(backup_file))
            
            # Add media files if requested
            if include_media and hasattr(settings, 'MEDIA_ROOT') and os.path.exists(settings.MEDIA_ROOT):
                media_root = settings.MEDIA_ROOT
                for root, dirs, files in os.walk(media_root):
                    for file in files:
                        file_path = os.path.join(root, file)
                        archive_name = os.path.relpath(file_path, media_root)
                        zipf.write(file_path, f'media/{archive_name}')
                
                self.stdout.write('Media files included in archive')
        
        # Remove the original backup file since it's now in the archive
        os.remove(backup_file)
        
        self.stdout.write(f'Archive created: {archive_path}')
