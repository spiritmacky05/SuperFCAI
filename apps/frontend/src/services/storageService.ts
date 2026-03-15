import { SavedReport, User, KnowledgeEntry } from '../types';

const API_BASE = '/api';

export const storageService = {
  // User Management
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (e) {
      console.error('getUsers error:', e);
      return [];
    }
  },

  saveUser: async (user: User): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        method: 'DELETE'
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
      
      if (response.status === 401) return null;
      if (!response.ok) throw new Error('Login failed');
      
      return await response.json();
    } catch (e) {
      console.error('login error:', e);
      return null;
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

  // Knowledge Base
  saveKnowledge: async (entry: KnowledgeEntry): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      if (!response.ok) throw new Error('Failed to save knowledge');
    } catch (e) {
      console.error('saveKnowledge error:', e);
    }
  },

  getKnowledge: async (): Promise<KnowledgeEntry[]> => {
    try {
      const response = await fetch(`${API_BASE}/knowledge`);
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
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete knowledge');
    } catch (e) {
      console.error('deleteKnowledge error:', e);
    }
  },

  // Reports
  saveReport: async (email: string, report: SavedReport): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, report })
      });
      if (!response.ok) throw new Error('Failed to save report');
    } catch (e) {
      console.error('saveReport error:', e);
    }
  },

  getReports: async (email: string): Promise<SavedReport[]> => {
    try {
      const response = await fetch(`${API_BASE}/reports?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return await response.json();
    } catch (e) {
      console.error('getReports error:', e);
      return [];
    }
  },

  // Legacy stubs for compatibility (if any remain)
  getCurrentUser: () => null,
  logout: () => {}
};
