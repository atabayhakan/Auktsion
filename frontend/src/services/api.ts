// src/services/api.ts
// Unified HTTP API client for iTorgo v2.0

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  user?: T;
  token?: string;
  error?: string;
  message?: string;
  meta?: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? (window.location.origin.includes(':5173') ? 'http://localhost:5000' : '') : '');
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getHeaders(customHeaders: Record<string, string> = {}, isMultipart = false): HeadersInit {
    const headers: Record<string, string> = { ...customHeaders };
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isMultipart = false
  ): Promise<{ data: T; status: number; ok: boolean }> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = this.getHeaders((options.headers as Record<string, string>) || {}, isMultipart);

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expired or invalid
        if (typeof window !== 'undefined') {
          // Do not redirect on public checks, but clean token
          const path = window.location.pathname;
          if (path.includes('/dashboard') || path.includes('/admin')) {
            // Can notify store
          }
        }
      }

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
        const error = new Error(errorMsg) as any;
        error.status = response.status;
        error.data = data;
        error.response = { data, status: response.status };
        throw error;
      }

      return { data, status: response.status, ok: response.ok };
    } catch (err: any) {
      // Re-throw formatted error
      throw err;
    }
  }

  public async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<{ data: T; status: number }> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T = any>(endpoint: string, body?: any): Promise<{ data: T; status: number }> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body || {}),
      },
      isFormData
    );
  }

  public async put<T = any>(endpoint: string, body?: any): Promise<{ data: T; status: number }> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: isFormData ? body : JSON.stringify(body || {}),
      },
      isFormData
    );
  }

  public async delete<T = any>(endpoint: string): Promise<{ data: T; status: number }> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
