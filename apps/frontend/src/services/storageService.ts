import { SavedReport, User, KnowledgeEntry } from '../types';

const API_BASE = '/api';

export const storageService = {
  // User Management
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        headers: storageService.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (e) {
      console.error('getUsers error:', e);
      return [];
    }
  },

  // Helper to get current user from local storage
  getUser: (): User | null => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  // Helper to get authentication headers
  getAuthHeaders(multipart = false): HeadersInit {
    const user = this.getUser();
    const sessionId = localStorage.getItem('session_id');
    const headers: Record<string, string> = {};
    
    if (!multipart) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (user?.email) headers['X-User-Email'] = user.email;
    if (sessionId) headers['X-Session-Id'] = sessionId;
    return headers;
  },

  // Helper to clear authentication details
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('session_id');
  },

  // Helper to set authentication details
  setAuth(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
    if (user.session_id) {
      localStorage.setItem('session_id', user.session_id);
    }
  },

  saveUser: async (user: User): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: storageService.getAuthHeaders(),
        body: JSON.stringify(user)
      });
      if (!response.ok) throw new Error('Failed to save user');
    } catch (e) {
      console.error('saveUser error:', e);
    }
  },

  deleteUser: async (email: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: storageService.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete user');
    } catch (e) {
      console.error('deleteUser error:', e);
    }
  },

  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      // Don't return null on 401, let it fall through to handle JSON error message
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server Error (${response.status})`);
      }
      
      return await response.json();
    } catch (e: any) {
      console.error('login error:', e);
      throw e;
    }
  },

  register: async (user: User): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
        return { success: false, error: errorData.error };
      }
      
      return { success: true };
    } catch (e) {
      console.error('register error:', e);
      return { success: false, error: 'Connection error' };
    }
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      return { success: true, message: data.message };
    } catch (e) {
      console.error('forgotPassword error:', e);
      return { success: false, error: 'Connection error' };
    }
  },

  resetPassword: async (token: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      return { success: true, message: data.message };
    } catch (e) {
      console.error('resetPassword error:', e);
      return { success: false, error: 'Connection error' };
    }
  },

  // Knowledge Base
  saveKnowledge: async (entry: KnowledgeEntry): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/knowledge`, {
        method: 'POST',
        headers: storageService.getAuthHeaders(),
        body: JSON.stringify(entry)
      });
      if (!response.ok) throw new Error('Failed to save knowledge');
    } catch (e) {
      console.error('saveKnowledge error:', e);
    }
  },

  getKnowledge: async (): Promise<KnowledgeEntry[]> => {
    try {
      const response = await fetch(`${API_BASE}/knowledge`, {
        headers: storageService.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch knowledge');
      return await response.json();
    } catch (e) {
      console.error('getKnowledge error:', e);
      return [];
    }
  },

  deleteKnowledge: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/knowledge/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: storageService.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete knowledge');
    } catch (e) {
      console.error('deleteKnowledge error:', e);
    }
  },

  // Reports
  saveReport: async (report: SavedReport): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: storageService.getAuthHeaders(),
        body: JSON.stringify({ report })
      });
      if (!response.ok) throw new Error('Failed to save report');
    } catch (e) {
      console.error('saveReport error:', e);
    }
  },

  getReports: async (): Promise<SavedReport[]> => {
    try {
      const response = await fetch(`${API_BASE}/reports`, {
        headers: storageService.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch reports');
      return await response.json();
    } catch (e) {
      console.error('getReports error:', e);
      return [];
    }
  },

  // Error Reports
  getErrorReports: async (): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE}/error-reports`, {
        headers: storageService.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch error reports');
      return await response.json();
    } catch (e) {
      console.error('getErrorReports error:', e);
      return [];
    }
  },

  updateErrorReportStatus: async (id: number, status: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/error-reports/${id}/status`, {
        method: 'PATCH',
        headers: storageService.getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update error report status');
    } catch (e) {
      console.error('updateErrorReportStatus error:', e);
      throw e;
    }
  },

  deleteErrorReport: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/error-reports/${id}`, {
        method: 'DELETE',
        headers: storageService.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete error report');
    } catch (e) {
      console.error('deleteErrorReport error:', e);
      throw e;
    }
  },
};
