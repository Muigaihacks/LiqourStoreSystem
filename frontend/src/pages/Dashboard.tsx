import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  CubeIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import BackupManager from '../components/BackupManager';

interface DashboardStats {
  totalSales: number;
  todaySales: number;
  totalProducts: number;
  lowStockItems: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    todaySales: 0,
    totalProducts: 0,
    lowStockItems: 0,
  });
  const [lowStockInventory, setLowStockInventory] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<any[]>([]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const saleDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('🚀 Starting to fetch dashboard data...');
      try {
        // Fetch data from Django API
        console.log('📡 Making API calls...');
        const [productsRes, inventoryRes, salesRes, todaySalesRes, topSellingRes] = await Promise.all([
          apiService.getProducts(),
          apiService.getInventory(),
          apiService.getSales(),
          apiService.getTodaySales(),
          apiService.getTopSellingProducts(30), // Last 30 days
        ]);

        console.log('✅ API responses received:', {
          products: productsRes.data,
          inventory: inventoryRes.data,
          sales: salesRes.data,
          todaySales: todaySalesRes.data,
          topSelling: topSellingRes.data,
        });

        const products = productsRes.data.results;
        const inventory = inventoryRes.data.results;
        const sales = salesRes.data.results;
        const todaySales = todaySalesRes.data;

        console.log('📊 Processed data:', {
          productsCount: products.length,
          inventoryCount: inventory.length,
          salesCount: sales.length,
          todaySalesData: todaySales,
        });

        // Calculate stats
        const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
        const lowStockItems = inventory.filter(item => item.is_low_stock);
        

        const newStats = {
          totalSales: totalSales,
          todaySales: todaySales.total_amount || 0,
          totalProducts: products.length,
          lowStockItems: lowStockItems.length,
        };

        console.log('📈 Final stats:', newStats);
        // Force state update
        setStats({ ...newStats });
        setLowStockInventory(lowStockItems);
        
        // Set recent sales (latest 3 sales)
        const recentSalesData = sales.slice(0, 3);
        setRecentSales(recentSalesData);
        
        // Set top-selling products (top 5 by quantity)
        const topSellingData = topSellingRes.data.top_by_quantity.slice(0, 5);
        setTopSellingProducts(topSellingData);
      } catch (error: any) {
        console.error('❌ Error fetching dashboard data:', error);
        console.error('Error details:', error.response?.data || error.message);
        // Set empty stats if API fails
        setStats({
          totalSales: 0,
          todaySales: 0,
          totalProducts: 0,
          lowStockItems: 0,
        });
        setLowStockInventory([]);
        setRecentSales([]);
        setTopSellingProducts([]);
      }
    };

    fetchDashboardData();
  }, []);

  const cards = [
    {
      title: 'Today\'s Sales',
      value: `KSh ${stats.todaySales.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Monthly Sales',
      value: `KSh ${stats.totalSales.toLocaleString()}`,
      icon: ShoppingCartIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: CubeIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems.toString(),
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your liquor store management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Sale #{sale.sale_number}</p>
                    <p className="text-sm text-gray-600">{formatTimeAgo(sale.created_at)}</p>
                  </div>
                  <span className="font-semibold text-green-600">
                    KSh {parseFloat(sale.total_amount).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="text-gray-500">
                  <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-medium text-gray-900">No recent sales</p>
                  <p className="text-xs text-gray-500">Sales will appear here once transactions are made</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h2>
          <div className="space-y-3">
            {lowStockInventory.length > 0 ? (
              lowStockInventory.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">
                      Only {item.quantity} left (minimum: {item.minimum_stock})
                    </p>
                  </div>
                  <span className="text-red-600 font-semibold">{item.quantity}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto h-12 w-12 text-green-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">All items in stock</h3>
                <p className="mt-1 text-sm text-gray-500">No items are currently below minimum stock levels.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top-Selling Products Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top-Selling Products (Last 30 Days)</h2>
        <div className="space-y-3">
          {topSellingProducts.length > 0 ? (
            topSellingProducts.map((product, index) => (
              <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.category_name} • {product.total_quantity_sold} sold • {product.profit_margin}% margin
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    KSh {parseFloat(product.total_revenue).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Profit: KSh {parseFloat(product.total_profit).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data yet</h3>
              <p className="mt-1 text-sm text-gray-500">Top-selling products will appear here once sales are made.</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Backup Section */}
      <div className="mt-8">
        <BackupManager />
      </div>
    </div>
  );
};

export default Dashboard;
