import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  CubeIcon,
  TagIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import ManagementProducts from './management/ManagementProducts';
import ManagementCategories from './management/ManagementCategories';
import ManagementInventory from './management/ManagementInventory';
import ManagementCustomers from './management/ManagementCustomers';
import ManagementPoints from './management/ManagementPoints';

const managementNav = [
  { name: 'Products', href: '/management/products', icon: CubeIcon },
  { name: 'Categories', href: '/management/categories', icon: TagIcon },
  { name: 'Inventory / Stock', href: '/management/inventory', icon: ArchiveBoxIcon },
  { name: 'Customers', href: '/management/customers', icon: UserGroupIcon },
  { name: 'Points', href: '/management/points', icon: CurrencyDollarIcon },
];

const Management: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage products, categories, stock, and loyalty customers for the selected branch.
        </p>
      </div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {managementNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `inline-flex items-center py-4 px-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-2" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <Routes>
          <Route path="/" element={<Navigate to="products" replace />} />
          <Route path="products" element={<ManagementProducts />} />
          <Route path="categories" element={<ManagementCategories />} />
          <Route path="inventory" element={<ManagementInventory />} />
          <Route path="customers" element={<ManagementCustomers />} />
          <Route path="points" element={<ManagementPoints />} />
        </Routes>
      </div>
    </div>
  );
};

export default Management;
