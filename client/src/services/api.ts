// API service for communicating with the backend
const API_BASE_URL = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      mode: 'cors',
      credentials: 'include', // Include cookies for session-based auth
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return { error: 'Failed to connect to server. Please ensure the backend is running.' };
      }
      
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.request<{
      user: any;
      token: string;
      expiresAt?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Analytics methods
  async getDashboardData() {
    return this.request<any>('/dashboard');
  }

  async getRevenueTrends(period: string = '12') {
    return this.request<any[]>(`/revenue-trends?period=${period}`);
  }

  async getSalesPerformance(period: string = '30') {
    return this.request<any[]>(`/sales-performance?period=${period}`);
  }

  async getPropertyPerformance() {
    return this.request<any[]>('/property-performance');
  }

  async getProperties() {
    return this.request<any[]>('/properties');
  }

  async updateProperty(id: number, property: any) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(property),
    });
  }

  async createProperty(property: any) {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(property),
    });
  }

  async getUserEntities(userId: number) {
    return this.request<any[]>(`/user/${userId}/entities`);
  }

  async getInvestorLeads(status?: string, limit: number = 50) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    
    return this.request<any[]>(`/investor-leads?${params}`);
  }

  async addMetrics(metrics: {
    metricDate: string;
    revenue: number;
    expenses: number;
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
  }) {
    return this.request('/metrics', {
      method: 'POST',
      body: JSON.stringify(metrics),
    });
  }

  async deleteProperty(id: number) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  async exportData(type: string, format: string = 'json', startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('format', format);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
      const response = await fetch(
        `${API_BASE_URL}/export?${params}`,
        {
          headers: {
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { data: 'Export downloaded successfully' };
      } else {
        const data = await response.json();
        return { data };
      }
    } catch (error) {
      console.error('Export failed:', error);
      return { error: error instanceof Error ? error.message : 'Export failed' };
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const apiService = new ApiService();
export default apiService;