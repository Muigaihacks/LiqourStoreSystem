"""
Automated backup scheduler for the Liquor Store System
Runs in the background and creates backups at specified intervals
"""
import os
import time
import threading
import logging
from datetime import datetime, timedelta
from django.core.management import call_command
from django.conf import settings


class BackupScheduler:
    """Automated backup scheduler"""
    
    def __init__(self, interval_hours=6, max_backups=20, backup_dir='backups'):
        self.interval_hours = interval_hours
        self.max_backups = max_backups
        self.backup_dir = backup_dir
        self.running = False
        self.thread = None
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('backup_scheduler.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('BackupScheduler')

    def start(self):
        """Start the automated backup scheduler"""
        if self.running:
            self.logger.warning("Backup scheduler is already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.thread.start()
        
        self.logger.info(f"🚀 Automated backup scheduler started")
        self.logger.info(f"📅 Backup interval: {self.interval_hours} hours")
        self.logger.info(f"📁 Backup directory: {self.backup_dir}")
        self.logger.info(f"🗂️  Max backups to keep: {self.max_backups}")

    def stop(self):
        """Stop the automated backup scheduler"""
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
        self.logger.info("🛑 Automated backup scheduler stopped")

    def _run_scheduler(self):
        """Main scheduler loop"""
        self.logger.info("⏰ Backup scheduler thread started")
        
        # Create initial backup
        self._create_backup()
        
        # Calculate next backup time
        next_backup = datetime.now() + timedelta(hours=self.interval_hours)
        self.logger.info(f"⏰ Next backup scheduled for: {next_backup.strftime('%Y-%m-%d %H:%M:%S')}")
        
        while self.running:
            try:
                # Check if it's time for a backup
                if datetime.now() >= next_backup:
                    self._create_backup()
                    next_backup = datetime.now() + timedelta(hours=self.interval_hours)
                    self.logger.info(f"⏰ Next backup scheduled for: {next_backup.strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Sleep for 5 minutes before checking again
                time.sleep(300)  # 5 minutes
                
            except Exception as e:
                self.logger.error(f"❌ Error in backup scheduler: {str(e)}")
                time.sleep(300)  # Wait 5 minutes before retrying

    def _create_backup(self):
        """Create a backup using Django management command"""
        try:
            self.logger.info("💾 Starting automated backup...")
            
            # Ensure backup directory exists
            if not os.path.exists(self.backup_dir):
                os.makedirs(self.backup_dir)
            
            # Create backup
            call_command('backup_data', 
                        format='json', 
                        output_dir=self.backup_dir)
            
            self.logger.info("✅ Automated backup created successfully")
            
            # Clean up old backups
            self._cleanup_old_backups()
            
        except Exception as e:
            self.logger.error(f"❌ Automated backup failed: {str(e)}")

    def _cleanup_old_backups(self):
        """Remove old backups to maintain max_backups limit"""
        try:
            if not os.path.exists(self.backup_dir):
                return
            
            # Get all backup files
            backup_files = []
            for filename in os.listdir(self.backup_dir):
                if filename.startswith('liquor_store_backup_'):
                    file_path = os.path.join(self.backup_dir, filename)
                    backup_files.append((file_path, os.path.getctime(file_path)))
            
            # Sort by creation time (newest first)
            backup_files.sort(key=lambda x: x[1], reverse=True)
            
            # Remove old backups if we exceed max_backups
            if len(backup_files) > self.max_backups:
                files_to_delete = backup_files[self.max_backups:]
                
                for file_path, _ in files_to_delete:
                    os.remove(file_path)
                    self.logger.info(f"🗑️  Deleted old backup: {os.path.basename(file_path)}")
                
                self.logger.info(f"🧹 Cleanup completed. Kept {self.max_backups} most recent backups")
            else:
                self.logger.info(f"📂 {len(backup_files)} backup(s) found, no cleanup needed")
                
        except Exception as e:
            self.logger.error(f"❌ Backup cleanup failed: {str(e)}")

    def get_status(self):
        """Get current scheduler status"""
        return {
            'running': self.running,
            'interval_hours': self.interval_hours,
            'max_backups': self.max_backups,
            'backup_dir': self.backup_dir,
            'thread_alive': self.thread.is_alive() if self.thread else False
        }


# Global scheduler instance
backup_scheduler = BackupScheduler()


def start_automated_backups(interval_hours=6, max_backups=20, backup_dir='backups'):
    """Start automated backups with specified parameters"""
    global backup_scheduler
    
    if backup_scheduler.running:
        backup_scheduler.stop()
    
    backup_scheduler = BackupScheduler(interval_hours, max_backups, backup_dir)
    backup_scheduler.start()
    
    return backup_scheduler


def stop_automated_backups():
    """Stop automated backups"""
    global backup_scheduler
    backup_scheduler.stop()


def get_backup_scheduler_status():
    """Get current backup scheduler status"""
    global backup_scheduler
    return backup_scheduler.get_status()
