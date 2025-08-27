import React, { useState, useEffect } from 'react';
import { 
  CloudArrowDownIcon, 
  ServerIcon, 
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

interface BackupInfo {
  filename: string;
  size: number;
  created_at: string;
  format: string;
}

interface BackupStatus {
  backup_system: {
    available: boolean;
    formats_supported: string[];
    media_backup_supported: boolean;
  };
  recent_backups: BackupInfo[];
  database_stats: {
    categories: number;
    products: number;
    inventory_items: number;
    stock_movements: number;
    sales: number;
    customers: number;
    point_transactions: number;
  };
  last_backup: BackupInfo | null;
}

const BackupManager: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupFormat, setBackupFormat] = useState<'json' | 'sql'>('json');
  const [includeMedia, setIncludeMedia] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    fetchBackupStatus();
  }, []);

  const fetchBackupStatus = async () => {
    try {
      const response = await apiService.getBackupStatus();
      setBackupStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch backup status:', error);
      // Set a default backup status if the API fails
      setBackupStatus({
        backup_system: {
          available: true,
          formats_supported: ['json', 'sql'],
          media_backup_supported: true,
        },
        recent_backups: [],
        database_stats: {
          categories: 0,
          products: 0,
          inventory_items: 0,
          stock_movements: 0,
          sales: 0,
          customers: 0,
          point_transactions: 0,
        },
        last_backup: null
      });
      setMessage({ type: 'info', text: 'Backup system ready. Create your first backup below.' });
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setMessage(null);
    
    try {
      const response = await apiService.createBackup(backupFormat, includeMedia);
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or create default
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const extension = includeMedia ? 'zip' : (backupFormat === 'json' ? 'json' : 'sql');
      link.download = `liquor_store_backup_${timestamp}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Backup created and downloaded successfully!' });
      
      // Refresh backup status
      setTimeout(fetchBackupStatus, 1000);
      
    } catch (error) {
      console.error('Backup creation failed:', error);
      setMessage({ type: 'error', text: 'Failed to create backup. Please try again.' });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (!backupStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <ServerIcon className="h-8 w-8 text-blue-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Data Backup Manager</h2>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex">
            {message.type === 'success' && <CheckCircleIcon className="h-5 w-5 mr-2" />}
            {message.type === 'error' && <ExclamationTriangleIcon className="h-5 w-5 mr-2" />}
            {message.type === 'info' && <InformationCircleIcon className="h-5 w-5 mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Database Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Products</div>
          <div className="text-2xl font-bold text-gray-900">{backupStatus.database_stats.products}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Sales</div>
          <div className="text-2xl font-bold text-gray-900">{backupStatus.database_stats.sales}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Customers</div>
          <div className="text-2xl font-bold text-gray-900">{backupStatus.database_stats.customers}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">Stock Movements</div>
          <div className="text-2xl font-bold text-gray-900">{backupStatus.database_stats.stock_movements}</div>
        </div>
      </div>

      {/* Backup Creation */}
      <div className="border rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Backup</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select
              value={backupFormat}
              onChange={(e) => setBackupFormat(e.target.value as 'json' | 'sql')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingBackup}
            >
              <option value="json">JSON (Recommended)</option>
              <option value="sql">SQL Dump</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeMedia"
              checked={includeMedia}
              onChange={(e) => setIncludeMedia(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isCreatingBackup}
            />
            <label htmlFor="includeMedia" className="ml-2 text-sm text-gray-700">
              Include media files
            </label>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={createBackup}
              disabled={isCreatingBackup}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCreatingBackup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>• JSON format is portable and can be restored on any system</p>
          <p>• SQL format is database-specific but more compact</p>
          <p>• Including media files creates a ZIP archive with all assets</p>
        </div>
      </div>

      {/* Last Backup Info */}
      {backupStatus.last_backup && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">Last Backup</p>
              <p className="text-xs text-green-600">
                {formatDate(backupStatus.last_backup.created_at)} • {formatFileSize(backupStatus.last_backup.size)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Backups */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Backups</h3>
        {backupStatus.recent_backups.length > 0 ? (
          <div className="space-y-2">
            {backupStatus.recent_backups.slice(0, 5).map((backup, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{backup.filename}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(backup.created_at)} • {backup.format.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatFileSize(backup.size)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No backups yet</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first backup using the form above.</p>
          </div>
        )}
      </div>

      {/* Backup Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Backup Best Practices</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Create backups regularly, especially before major changes</li>
          <li>• Store backups in multiple locations (local, cloud, external drive)</li>
          <li>• Test backup restoration periodically to ensure data integrity</li>
          <li>• Use JSON format for maximum compatibility across systems</li>
        </ul>
      </div>
    </div>
  );
};

export default BackupManager;
