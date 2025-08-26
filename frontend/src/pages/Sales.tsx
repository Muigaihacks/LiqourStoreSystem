import React, { useState, useEffect } from 'react';
import { CalendarIcon, CurrencyDollarIcon, PlusIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import QuickSale from '../components/QuickSale';
import createReceiptGenerator from '../components/ReceiptGenerator';

interface Sale {
  id: number;
  sale_number: string;
  total_amount: string;
  created_at: string;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showQuickSale, setShowQuickSale] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await apiService.getSales();
        setSales(response.data.results);
      } catch (error) {
        console.error('Error fetching sales:', error);
      }
    };
    
    fetchSales();
  }, []);

  const getTotalSales = () => {
    return sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePrintReceipt = (sale: Sale) => {
    const receiptData = {
      sale_number: sale.sale_number,
      total_amount: sale.total_amount,
      created_at: sale.created_at,
      payment_method: 'MPESA' // Default to MPESA for single-item sales
    };
    
    const receiptGenerator = createReceiptGenerator({ saleData: receiptData });
    receiptGenerator.printReceipt();
  };

  const handleDownloadReceipt = (sale: Sale) => {
    const receiptData = {
      sale_number: sale.sale_number,
      total_amount: sale.total_amount,
      created_at: sale.created_at,
      payment_method: 'MPESA' // Default to MPESA for single-item sales
    };
    
    const receiptGenerator = createReceiptGenerator({ saleData: receiptData });
    receiptGenerator.downloadReceipt();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-600">View and analyze sales data</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowQuickSale(!showQuickSale)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {showQuickSale ? 'Hide Quick Sale' : 'Quick Sale'}
          </button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Quick Sale Component */}
      {showQuickSale && (
        <div className="border-t border-gray-200 pt-6">
          <QuickSale />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                KSh {getTotalSales().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Number of Sales</p>
              <p className="text-2xl font-semibold text-gray-900">{sales.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {sale.sale_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      KSh {parseFloat(sale.total_amount).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(sale.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        View Details
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(sale)}
                        className="inline-flex items-center text-green-600 hover:text-green-900"
                        title="Print Receipt"
                      >
                        <PrinterIcon className="h-4 w-4 mr-1" />
                        Print
                      </button>
                      <button
                        onClick={() => handleDownloadReceipt(sale)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                        title="Download Receipt"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
