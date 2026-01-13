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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 Inventory component mounted, starting fetch...');
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📦 Fetching inventory data...');
        console.log('API Base URL:', process.env.REACT_APP_API_URL || '/api');
        
        const inventoryResponse = await apiService.getInventory();
        console.log('✅ Full Inventory response object:', inventoryResponse);
        console.log('✅ Inventory response.data:', inventoryResponse.data);
        console.log('✅ Is array?', Array.isArray(inventoryResponse.data));
        
        const productsResponse = await apiService.getProducts();
        console.log('✅ Products response:', productsResponse.data);
        
        // Handle both paginated and non-paginated responses
        let inventoryData: InventoryItem[] = [];
        if (Array.isArray(inventoryResponse.data)) {
          inventoryData = inventoryResponse.data;
        } else if (inventoryResponse.data?.results) {
          inventoryData = inventoryResponse.data.results;
        }
        
        let productsData: Product[] = [];
        if (Array.isArray(productsResponse.data)) {
          productsData = productsResponse.data;
        } else if (productsResponse.data?.results) {
          productsData = productsResponse.data.results;
        }
        
        console.log(`📊 Processed ${inventoryData.length} inventory items`);
        console.log(`📊 Processed ${productsData.length} products`);
        if (inventoryData.length > 0) {
          console.log('First inventory item:', inventoryData[0]);
        }
        
        setInventory(inventoryData);
        setProducts(productsData);
        setLoading(false);
      } catch (error: any) {
        console.error('❌ Error fetching data:', error);
        console.error('Error response:', error.response);
        if (error.response) {
          console.error('Error status:', error.response.status);
          console.error('Error data:', error.response.data);
        }
        setError(`Failed to load inventory: ${error.message || 'Unknown error'}`);
        setLoading(false);
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

  console.log('🔄 Inventory component render - inventory.length:', inventory.length);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Fetching inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">View current stock levels and product information</p>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <p><strong>Debug Info:</strong> Inventory items: {inventory.length} | Products: {products.length} | Loading: {loading ? 'Yes' : 'No'} | Error: {error || 'None'}</p>
        </div>
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
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium">No inventory found</p>
                      <p className="text-sm mt-2">
                        {inventory.length === 0 
                          ? "No inventory records exist. Add products and create inventory records in the admin panel."
                          : "No items match your search criteria."}
                      </p>
                      <p className="text-xs mt-4 text-gray-400">
                        Total inventory items: {inventory.length}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
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
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
