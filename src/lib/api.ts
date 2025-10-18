// Simple API client for PostgreSQL backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signUp(email: string, password: string, displayName?: string) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    this.setToken(data.token);
    return data;
  }

  async signIn(email: string, password: string) {
    const data = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getUser() {
    return this.request('/auth/user');
  }

  signOut() {
    this.setToken(null);
  }

  // Profile endpoints
  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(data: any) {
    return this.request('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Generic CRUD methods
  async getAll(table: string) {
    return this.request(`/${table}`);
  }

  async getOne(table: string, id: string) {
    return this.request(`/${table}/${id}`);
  }

  async create(table: string, data: any) {
    return this.request(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(table: string, id: string, data: any) {
    return this.request(`/${table}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(table: string, id: string) {
    return this.request(`/${table}/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
