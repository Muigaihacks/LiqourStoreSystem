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

export interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Sale {
  id: number;
  sale_number: string;
  employee: number;
  employee_name: string;
  total_amount: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
  items?: SaleItem[]; // Optional for list view, included in detail view
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
  getTopSellingProducts: (days: number = 30) => api.get(`/products/top_selling/?days=${days}`),
  
  // Categories
  getCategories: () => api.get<PaginatedResponse<Category>>('/categories/'),
  
  // Inventory
  getInventory: () => api.get<PaginatedResponse<Inventory>>('/inventory/'),
  
  // Sales
  getSales: () => api.get<PaginatedResponse<Sale>>('/sales/'),
  getSale: (id: number) => api.get<Sale>(`/sales/${id}/`), // Get detailed sale with items
  getTodaySales: () => api.get('/sales/today_sales/'),
  getSalesSummary: (days: number = 7) => api.get(`/sales/sales_summary/?days=${days}`),
  createSale: (saleData: any) => api.post<Sale>('/create-sale/', saleData),
  updateSale: (saleId: number, updateData: any) => api.patch<Sale>(`/sales/${saleId}/`, updateData),
  
  // Barcode lookup
  lookupBarcode: (barcode: string) => api.post<Product>('/products/barcode_lookup/', { barcode }),
  
  // Customers
  getCustomers: () => api.get('/customers/'),
  getCustomer: (id: number) => api.get(`/customers/${id}/`),
  registerCustomer: (customerData: any) => api.post('/customers/register/', customerData),
  getPrizeEligibleCustomers: (threshold: number = 100) => api.get(`/customers/prize_eligible/?threshold=${threshold}`),
  awardPoints: (pointsData: any) => api.post('/award-points/', pointsData),

  // Backup
  createBackup: (format: 'json' | 'sql' = 'json', includeMedia: boolean = false) => 
    api.post('/backup/create/', { format, include_media: includeMedia }, { responseType: 'blob' }),
  getBackupStatus: () => api.get('/backup/status/'),
};

export default api;
