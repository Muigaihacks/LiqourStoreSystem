import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ShoppingCartIcon, 
  CubeIcon, 
  ChartBarIcon, 
  TagIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import liquorIcon from '../assets/icons/liqour-icon.png';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Inventory', href: '/inventory', icon: CubeIcon },
    { name: 'Sales', href: '/sales', icon: ChartBarIcon },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-3">
                {/* Custom Liquor Icon */}
                <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center p-1">
                  <img 
                    src={liquorIcon} 
                    alt="Liquor Store Icon" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Liquor Store
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">Management System</p>
                </div>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-1" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Welcome, {user?.username || 'User'} ({user?.role || 'employee'})
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
