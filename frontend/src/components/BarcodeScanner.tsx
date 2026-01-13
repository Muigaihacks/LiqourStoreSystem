import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  placeholder = "Scan barcode or enter manually...",
  disabled = false 
}) => {
  const [barcode, setBarcode] = useState('');
  const [scanMode, setScanMode] = useState<'usb' | 'camera'>('usb');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // USB Scanner Logic - detects rapid typing (typical of barcode scanners)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcode(value);

    // Clear previous timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    // Set timeout to detect end of scan (USB scanners are very fast)
    scanTimeoutRef.current = setTimeout(() => {
      const trimmedValue = value.trim();
      if (trimmedValue.length >= 8) { // Minimum barcode length
        handleScan(trimmedValue);
      }
    }, 100); // 100ms delay to detect end of rapid input
  };

  // Handle manual entry (Enter key or button click)
  const handleManualScan = () => {
    const trimmedBarcode = barcode.trim();
    if (trimmedBarcode.length >= 8) {
      handleScan(trimmedBarcode);
    } else {
      // Show error for short barcodes
      alert('Barcode must be at least 8 characters long');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  };

  const handleScan = (scannedCode: string) => {
    onScan(scannedCode);
    setBarcode('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Camera Scanner Logic (placeholder for future implementation)
  const startCameraScanning = () => {
    setIsScanning(true);
    // TODO: Implement camera scanning using @zxing/library
    // For now, we'll focus on USB scanner functionality
    alert('Camera scanning will be implemented in the next phase. Please use USB scanner or manual entry for now.');
    setIsScanning(false);
  };

  // Auto-focus input for USB scanner
  useEffect(() => {
    if (scanMode === 'usb' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setScanMode('usb')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            scanMode === 'usb'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={disabled}
        >
          USB Scanner
        </button>
        <button
          type="button"
          onClick={() => setScanMode('camera')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            scanMode === 'camera'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={disabled}
        >
          Camera
        </button>
      </div>

      {/* USB Scanner Input */}
      {scanMode === 'usb' && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="block w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleManualScan}
            disabled={disabled || barcode.length < 8}
            className="absolute right-2 top-2 px-4 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Scan
          </button>
        </div>
      )}

      {/* Camera Scanner */}
      {scanMode === 'camera' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {!isScanning ? (
            <div>
              <CameraIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Camera Scanner</h3>
              <p className="mt-2 text-sm text-gray-500">
                Click to start scanning barcodes with your camera
              </p>
              <button
                type="button"
                onClick={startCameraScanning}
                disabled={disabled}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Start Camera
              </button>
            </div>
          ) : (
            <div>
              <div className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <p className="mt-2 text-sm text-gray-600">Scanning for barcodes...</p>
              <button
                type="button"
                onClick={() => setIsScanning(false)}
                className="mt-2 px-4 py-1 text-sm text-red-600 hover:text-red-800"
              >
                Stop Scanning
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>USB Scanner:</strong> Just scan - the barcode will appear automatically</p>
        <p><strong>Manual Entry:</strong> Type barcode and press Enter or click Scan</p>
        <p><strong>Camera:</strong> Point camera at barcode (coming soon)</p>
      </div>
    </div>
  );
};

export default BarcodeScanner;
