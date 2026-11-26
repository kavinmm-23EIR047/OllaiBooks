const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export class ApiClient {
  private static getActiveTenantId(): string {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('billpilot_active_tenant_id') || '';
  }

  private static getAuthToken(): string {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('billpilot_jwt_token') || '';
  }

  static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getAuthToken();
    const tenantId = this.getActiveTenantId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) return undefined as T;
    if (response.headers.get('content-type')?.includes('application/pdf')) return await response.blob() as T;
    return response.json();
  }

  static get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}
