import axios from 'axios';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  name: string;
  role: "admin" | "employee";
  pin?: string; // Only present in login response
  is_active?: boolean;
}

export interface LoginRequest {
  userId: string;
  pin: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stock_quantity: number;
  nominal_stock: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  group: string;
  is_visible: boolean;
}

export interface ProductIngredient {
  ingredient_id: number;
  quantity_needed: number;
  ingredient_name?: string;
  unit?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_per_item: number;
  product_name?: string;
}

export interface Order {
  id: number;
  user_id: number;
  status: 'open' | 'completed' | 'cancelled';
  total_price: number;
  created_at: string;
  items?: OrderItem[];
}

export interface Log {
  id: number;
  user_id: number;
  action: string;
  module: string;
  details: string;
  created_at: string;
  user_name?: string;
}

// === USERS API ===
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch users');
    }
  },
};

export const shiftsAPI = {
  getAll: async (date?: string) => {
    try {
      const query = date ? `?date=${date}` : '';
      const response = await api.get(`/api/shifts${query}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch shifts');
    }
  },
  create: async (shift: { user_id: number; start_time: string; end_time: string }, user: User) => {
    try {
      const response = await api.post('/api/shifts', { ...shift, user_id: user.id });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create shift');
    }
  },
};

// === REPORTS API ===
export const reportsAPI = {
  getDaily: async (date: string) => {
    try {
      const response = await api.get(`/api/reports/daily?date=${date}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch daily report');
    }
  },
};

export const logsAPI = {
  getAll: async (limit: number = 100, offset: number = 0) => {
    try {
      const response = await api.get(`/api/logs?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch logs');
    }
  },
  create: async (log: { user_id?: number; action: string; module: string; details: string }, user: User) => {
    try {
      const response = await api.post('/api/logs', { ...log, user_id: user.id });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create log entry');
    }
  },
};

// === AUTHENTICATION API ===
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  },

  logout: async (user: User): Promise<void> => {
    try {
      await api.post('/auth/logout', { user_id: user.id });
      localStorage.removeItem('authToken');
    } catch (error) {
      localStorage.removeItem('authToken');
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user information');
    }
  },
};

// === INGREDIENTS API (WAREHOUSE) ===
export const ingredientsAPI = {
  getAll: async (): Promise<Ingredient[]> => {
    try {
      const response = await api.get('/api/ingredients');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch ingredients');
    }
  },
  
  create: async (ingredient: Omit<Ingredient, 'id'>, user: User): Promise<Ingredient> => {
    try {
      const response = await api.post('/api/ingredients', { ...ingredient, user_id: user.id });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create ingredient');
    }
  },
  
  update: async (id: number, ingredient: Partial<Ingredient>, user: User): Promise<Ingredient> => {
    try {
      const response = await api.put(`/api/ingredients/${id}`, { ...ingredient, user });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update ingredient');
    }
  },
  
  deactivate: async (id: number, user: User): Promise<void> => {
    // Axios wymaga, aby ciało żądania w metodzie DELETE było wewnątrz obiektu `data`
    await api.delete(`/api/ingredients/${id}`, { data: { user } });
  },
  
  delete: async (id: number, user: User): Promise<void> => {
    try {
      await api.delete(`/api/ingredients/${id}`, { data: { user_id: user.id } });
    } catch (error) {
      throw new Error('Failed to delete ingredient');
    }
  },
};

// === PRODUCTS API (MENU) ===
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    try {
      const response = await api.get('/api/menu');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch menu items');
    }
  },
  
  create: async (product: {
    name: string;
    price: number;
    group: string;
    ingredients?: { ingredient_id: number; quantity_needed: number }[];
  }, user: User): Promise<Product> => {
    try {
      const response = await api.post('/api/menu', { ...product, user_id: user.id });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create menu item');
    }
  },
  
  update: async (id: number, product: {
    name: string;
    price: number;
    group: string;
    ingredients?: { ingredient_id: number; quantity_needed: number }[];
  }, user: User): Promise<Product> => {
    try {
      const response = await api.put(`/api/menu/${id}`, { ...product, user_id: user.id });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update menu item');
    }
  },
  
  delete: async (id: number, user: User): Promise<void> => {
    try {
      await api.delete(`/api/menu/${id}`, { data: { user_id: user.id } });
    } catch (error) {
      throw new Error('Failed to delete menu item');
    }
  },

  getIngredients: async (productId: number): Promise<ProductIngredient[]> => {
    try {
      const response = await api.get(`/api/menu/${productId}/ingredients`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch product ingredients');
    }
  },
};

// === ORDERS API ===
export const ordersAPI = {
  getAll: async (status?: string): Promise<Order[]> => {
    try {
      const url = status ? `/api/orders?status=${status}` : '/api/orders';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch orders');
    }
  },

  getById: async (id: number): Promise<Order> => {
    try {
      const response = await api.get(`/api/orders/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch order');
    }
  },
  
  create: async (order: {
    userId: number;
    items: { id: number; quantity: number; price: number }[];
    total: number;
  }, user: User): Promise<{ id: number; message: string }> => {
    try {
      const response = await api.post('/api/orders', { ...order, user_id: user.id });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create order');
    }
  },

  complete: async (orderId: number, user: User): Promise<void> => {
    await api.post(`/api/orders/${orderId}/complete`, { user });
  },
  
update: async (orderId: number, items: any[], total: number, user: User): Promise<Order> => {
    try {
      const { data } = await api.put(`/api/orders/${orderId}`, { items, total_price: total, user });
      return data;
    } catch (error) {
      throw new Error('Failed to update order');
    }
  },
  
  delete: async (id: number, user: User): Promise<void> => {
    try {
      await api.delete(`/api/orders/${id}`, { data: { user_id: user.id } });
    } catch (error) {
      throw new Error('Failed to delete order');
    }
  },
};

// === LOGS API ===
export const newLogsAPI = {
  getAll: async (limit?: number, offset?: number): Promise<Log[]> => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      const response = await api.get(`/api/logs?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch logs');
    }
  },
  
  create: async (log: {
    user_id?: number;
    action: string;
    module: string;
    details: string;
  }, user: User): Promise<Log> => {
    try {
      const response = await api.post('/api/logs', { ...log, user_id: user.id });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create log entry');
    }
  },
};

// === REPORTS API (placeholder - can be implemented later) ===
export const newReportsAPI = {
  getDailyReport: async (date: string) => {
    try {
      // Placeholder implementation
      return { message: 'Daily reports not yet implemented' };
    } catch (error) {
      throw new Error('Failed to fetch daily report');
    }
  },
  
  getWeeklyReport: async (weekStart: string) => {
    try {
      // Placeholder implementation
      return { message: 'Weekly reports not yet implemented' };
    } catch (error) {
      throw new Error('Failed to fetch weekly report');
    }
  },
  
  getMonthlyReport: async (month: string) => {
    try {
      // Placeholder implementation
      return { message: 'Monthly reports not yet implemented' };
    } catch (error) {
      throw new Error('Failed to fetch monthly report');
    }
  },
};

// === SCHEDULE API (placeholder - can be implemented later) ===
export const newScheduleAPI = {
  getAll: async () => {
    try {
      // Placeholder implementation
      return [];
    } catch (error) {
      throw new Error('Failed to fetch schedule');
    }
  },
  
  create: async (schedule: any, user: User) => {
    try {
      // Placeholder implementation
      return { ...schedule, user_id: user.id };
    } catch (error) {
      throw new Error('Failed to create schedule');
    }
  },
  
  update: async (id: string, schedule: any, user: User) => {
    try {
      // Placeholder implementation
      return { ...schedule, user_id: user.id, id };
    } catch (error) {
      throw new Error('Failed to update schedule');
    }
  },
  
  delete: async (id: string, user: User) => {
    try {
      // Placeholder implementation - would need user_id for logging
    } catch (error) {
      throw new Error('Failed to delete schedule');
    }
  },
};

// === LEGACY COMPATIBILITY ===
// Backward compatibility with old API structure
export const menuAPI = productsAPI;
export const warehouseAPI = ingredientsAPI;
// export const logsAPI = newLogsAPI; // Remove duplicate
// export const reportsAPI = newReportsAPI; // Remove duplicate
export const scheduleAPI = newScheduleAPI;

export default api;