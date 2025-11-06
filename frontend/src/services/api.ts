import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  id: string;
  name: string;
  role: "admin" | "employee";
  email?: string;
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

// Authentication API
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

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
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

// Menu API
export const menuAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/menu');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch menu items');
    }
  },
  
  create: async (item: any) => {
    try {
      const response = await api.post('/menu', item);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create menu item');
    }
  },
  
  update: async (id: string, item: any) => {
    try {
      const response = await api.put(`/menu/${id}`, item);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update menu item');
    }
  },
  
  delete: async (id: string) => {
    try {
      await api.delete(`/menu/${id}`);
    } catch (error) {
      throw new Error('Failed to delete menu item');
    }
  },
};

// Orders API
export const ordersAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch orders');
    }
  },
  
  create: async (order: any) => {
    try {
      const response = await api.post('/orders', order);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create order');
    }
  },
  
  update: async (id: string, order: any) => {
    try {
      const response = await api.put(`/orders/${id}`, order);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update order');
    }
  },
  
  delete: async (id: string) => {
    try {
      await api.delete(`/orders/${id}`);
    } catch (error) {
      throw new Error('Failed to delete order');
    }
  },
};

// Reports API
export const reportsAPI = {
  getDailyReport: async (date: string) => {
    try {
      const response = await api.get(`/reports/daily?date=${date}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch daily report');
    }
  },
  
  getWeeklyReport: async (weekStart: string) => {
    try {
      const response = await api.get(`/reports/weekly?weekStart=${weekStart}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch weekly report');
    }
  },
  
  getMonthlyReport: async (month: string) => {
    try {
      const response = await api.get(`/reports/monthly?month=${month}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch monthly report');
    }
  },
};

// Logs API
export const logsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/logs');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch logs');
    }
  },
  
  create: async (log: any) => {
    try {
      const response = await api.post('/logs', log);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create log entry');
    }
  },
};

// Warehouse API
export const warehouseAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/warehouse');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch warehouse items');
    }
  },
  
  create: async (item: any) => {
    try {
      const response = await api.post('/warehouse', item);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create warehouse item');
    }
  },
  
  update: async (id: string, item: any) => {
    try {
      const response = await api.put(`/warehouse/${id}`, item);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update warehouse item');
    }
  },
  
  delete: async (id: string) => {
    try {
      await api.delete(`/warehouse/${id}`);
    } catch (error) {
      throw new Error('Failed to delete warehouse item');
    }
  },
};

// Schedule API
export const scheduleAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/schedule');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch schedule');
    }
  },
  
  create: async (schedule: any) => {
    try {
      const response = await api.post('/schedule', schedule);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create schedule');
    }
  },
  
  update: async (id: string, schedule: any) => {
    try {
      const response = await api.put(`/schedule/${id}`, schedule);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update schedule');
    }
  },
  
  delete: async (id: string) => {
    try {
      await api.delete(`/schedule/${id}`);
    } catch (error) {
      throw new Error('Failed to delete schedule');
    }
  },
};

export default api;