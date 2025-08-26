import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

interface InventoryItem {
  id: number;
  product_name: string;
  product_barcode: string;
  quantity: number;
  minimum_stock: number;
  is_low_stock: boolean;
  last_updated: string;
  product: number;
}

interface Product {
  id: number;
  name: string;
  barcode: string;
  price: string;
  category_name: string;
  brand: string;
  size: string;
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventoryResponse, productsResponse] = await Promise.all([
          apiService.getInventory(),
          apiService.getProducts()
        ]);
        setInventory(inventoryResponse.data.results);
        setProducts(productsResponse.data.results);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  const getProductPrice = (productId: number): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.price : '0.00';
  };

  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_barcode.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">View current stock levels and product information</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search Inventory
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by name or barcode..."
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Current Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.product_barcode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      KSh {parseFloat(getProductPrice(item.product)).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.is_low_stock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
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

export default Inventory;
