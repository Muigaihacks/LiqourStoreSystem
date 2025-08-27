"""
Django management command to control automated backups
"""
from django.core.management.base import BaseCommand
from store.backup_scheduler import (
    start_automated_backups, 
    stop_automated_backups, 
    get_backup_scheduler_status
)


class Command(BaseCommand):
    help = 'Control automated backup system'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            type=str,
            choices=['start', 'stop', 'status'],
            help='Action to perform: start, stop, or status'
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=6,
            help='Backup interval in hours (default: 6)'
        )
        parser.add_argument(
            '--max-backups',
            type=int,
            default=20,
            help='Maximum number of backups to keep (default: 20)'
        )
        parser.add_argument(
            '--backup-dir',
            type=str,
            default='backups',
            help='Backup directory (default: backups)'
        )

    def handle(self, *args, **options):
        action = options['action']
        
        if action == 'start':
            self.start_backups(options)
        elif action == 'stop':
            self.stop_backups()
        elif action == 'status':
            self.show_status()

    def start_backups(self, options):
        """Start automated backups"""
        interval = options['interval']
        max_backups = options['max_backups']
        backup_dir = options['backup_dir']
        
        self.stdout.write('🚀 Starting automated backup system...')
        
        try:
            scheduler = start_automated_backups(interval, max_backups, backup_dir)
            
            self.stdout.write(
                self.style.SUCCESS('✅ Automated backups started successfully!')
            )
            self.stdout.write(f'📅 Backup interval: {interval} hours')
            self.stdout.write(f'📁 Backup directory: {backup_dir}')
            self.stdout.write(f'🗂️  Max backups: {max_backups}')
            self.stdout.write('\n💡 Backups will run automatically in the background')
            self.stdout.write('📝 Check backup_scheduler.log for detailed logs')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to start automated backups: {str(e)}')
            )

    def stop_backups(self):
        """Stop automated backups"""
        self.stdout.write('🛑 Stopping automated backup system...')
        
        try:
            stop_automated_backups()
            self.stdout.write(
                self.style.SUCCESS('✅ Automated backups stopped successfully!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to stop automated backups: {str(e)}')
            )

    def show_status(self):
        """Show current backup system status"""
        try:
            status = get_backup_scheduler_status()
            
            self.stdout.write('📊 Automated Backup System Status')
            self.stdout.write('=' * 40)
            
            if status['running']:
                self.stdout.write(
                    self.style.SUCCESS('🟢 Status: RUNNING')
                )
                self.stdout.write(f'⏰ Interval: {status["interval_hours"]} hours')
                self.stdout.write(f'📁 Backup directory: {status["backup_dir"]}')
                self.stdout.write(f'🗂️  Max backups: {status["max_backups"]}')
                self.stdout.write(f'🧵 Thread alive: {"Yes" if status["thread_alive"] else "No"}')
            else:
                self.stdout.write(
                    self.style.WARNING('🔴 Status: STOPPED')
                )
                self.stdout.write('💡 Run "python manage.py auto_backup start" to begin')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to get status: {str(e)}')
            )
