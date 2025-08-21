import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ShoppingCartIcon, 
  CubeIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

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

  useEffect(() => {
    // TODO: Fetch real data from Django API
    setStats({
      totalSales: 125000,
      todaySales: 8500,
      totalProducts: 45,
      lowStockItems: 3,
    });
  }, []);

  const cards = [
    {
      title: 'Today\'s Sales',
      value: `KSh ${stats.todaySales.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Total Sales',
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
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Sale #SALE-000123</p>
                <p className="text-sm text-gray-600">2 minutes ago</p>
              </div>
              <span className="font-semibold text-green-600">KSh 2,500</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Sale #SALE-000122</p>
                <p className="text-sm text-gray-600">15 minutes ago</p>
              </div>
              <span className="font-semibold text-green-600">KSh 1,800</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <div>
                <p className="font-medium">Glenfiddich 12yr 750ml</p>
                <p className="text-sm text-gray-600">Only 2 bottles left</p>
              </div>
              <span className="text-red-600 font-semibold">2</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <div>
                <p className="font-medium">Jack Daniel's 1L</p>
                <p className="text-sm text-gray-600">Only 1 bottle left</p>
              </div>
              <span className="text-red-600 font-semibold">1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
