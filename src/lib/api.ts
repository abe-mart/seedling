// Simple API client for single-user PostgreSQL backend
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3006';

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

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

  // Settings endpoints
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(data: any) {
    return this.request('/settings', {
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
