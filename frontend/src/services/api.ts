import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API interfaces matching Django models
export interface Product {
  id: number;
  name: string;
  barcode: string;
  category: number;
  category_name: string;
  price: string;
  size: string;
  age: string;
  brand: string;
  is_active: boolean;
  current_stock: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: number;
  product: number;
  product_name: string;
  product_barcode: string;
  quantity: number;
  minimum_stock: number;
  is_low_stock: boolean;
  last_updated: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  employee: number;
  total_amount: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_sales: number;
  today_sales: number;
  total_products: number;
  low_stock_items: number;
}

// Paginated response interface
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API service functions
export const apiService = {
  // Products
  getProducts: () => api.get<PaginatedResponse<Product>>('/products/'),
  getProduct: (id: number) => api.get<Product>(`/products/${id}/`),
  
  // Categories
  getCategories: () => api.get<PaginatedResponse<Category>>('/categories/'),
  
  // Inventory
  getInventory: () => api.get<PaginatedResponse<Inventory>>('/inventory/'),
  
  // Sales
  getSales: () => api.get<PaginatedResponse<Sale>>('/sales/'),
  getTodaySales: () => api.get('/sales/today_sales/'),
  getSalesSummary: (days: number = 7) => api.get(`/sales/sales_summary/?days=${days}`),
  
  // Barcode lookup
  lookupBarcode: (barcode: string) => api.post<Product>('/products/barcode_lookup/', { barcode }),
};

export default api;
