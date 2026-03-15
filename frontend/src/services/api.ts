import axios from 'axios';

// Base API configuration
// Use environment variable for production, localhost for development
const getApiBaseUrl = () => {
  // Allow environment variable override
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Always default to local backend on port 8000
  // This handles localhost, 127.0.0.1, and local network IPs (e.g. 192.168.x.x)
  return `http://${window.location.hostname}:8000/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token: set after login so all requests send Authorization header
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// Branch scope for Management: set from AuthContext selectedProfile
let currentBranchId: number | null = null;
export function setApiBranchId(branchId: number | null) {
  currentBranchId = branchId;
  if (branchId != null) {
    api.defaults.headers.common['X-Branch-Id'] = String(branchId);
  } else {
    delete api.defaults.headers.common['X-Branch-Id'];
  }
}
api.interceptors.request.use((config) => {
  if (currentBranchId != null) {
    config.headers['X-Branch-Id'] = String(currentBranchId);
  }
  return config;
});

export interface AuthProfile {
  branch_id: number;
  branch_name: string;
  can_use_management_module: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  profiles: AuthProfile[];
}

export interface MeResponse {
  user: AuthUser;
  profiles: AuthProfile[];
}

// Use paths without leading slash so axios appends to baseURL (e.g. http://localhost:8000/api + auth/login/)
export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('auth/login/', { username, password }),
  logout: () => api.post('auth/logout/'),
  me: () => api.get<MeResponse>('auth/me/'),
};

// API interfaces matching Django models
export interface Product {
  id: number;
  name: string;
  barcode: string;
  branch?: number;
  category: number;
  category_name: string;
  price: string;
  buying_price?: string;
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
  getProducts: (params?: { branch_id?: number; search?: string; category?: string }) =>
    api.get<PaginatedResponse<Product>>('/products/', { params }),
  getProduct: (id: number) => api.get<Product>(`/products/${id}/`),
  createProduct: (data: Partial<Product> & { branch?: number }) => api.post<Product>('/products/', data),
  updateProduct: (id: number, data: Partial<Product>) => api.patch<Product>(`/products/${id}/`, data),
  deleteProduct: (id: number) => api.delete(`/products/${id}/`),
  getTopSellingProducts: (days: number = 30) => api.get(`/products/top_selling/?days=${days}`),
  
  // Categories
  getCategories: () => api.get<PaginatedResponse<Category>>('/categories/'),
  createCategory: (data: Partial<Category>) => api.post<Category>('/categories/', data),
  updateCategory: (id: number, data: Partial<Category>) => api.patch<Category>(`/categories/${id}/`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}/`),
  
  // Inventory
  getInventory: (params?: { branch_id?: number }) =>
    api.get<PaginatedResponse<Inventory>>('/inventory/', { params }),
  stockIn: (data: { product_id: number; quantity: number; notes?: string }) =>
    api.post<Inventory>('/inventory/stock_in/', data),
  
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
  getCustomers: (params?: { phone?: string }) => api.get('/customers/', { params }),
  getCustomer: (id: number) => api.get(`/customers/${id}/`),
  registerCustomer: (customerData: any) => api.post('/customers/register/', customerData),
  getPrizeEligibleCustomers: (threshold: number = 100) => api.get(`/customers/prize_eligible/?threshold=${threshold}`),
  awardPoints: (pointsData: any) => api.post('/award-points/', pointsData),
  
  // Point Transactions
  getPointTransactions: () => api.get('/point-transactions/'),
  getPointTransaction: (id: number) => api.get(`/point-transactions/${id}/`),
  getCustomerPointTransactions: (customerId: number) => api.get(`/point-transactions/?customer_id=${customerId}`),

  // Backup
  createBackup: (format: 'json' | 'sql' = 'json', includeMedia: boolean = false) => 
    api.post('/backup/create/', { format, include_media: includeMedia }, { responseType: 'blob' }),
  getBackupStatus: () => api.get('/backup/status/'),
  controlAutomatedBackups: (action: 'start' | 'stop' | 'status', options?: any) =>
    api.post('/backup/auto/', { action, ...options }),
};

export default api;
