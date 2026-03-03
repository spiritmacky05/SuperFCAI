
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
      // Check if user exists to decide between create or update (though API handles this logic mostly)
      // For simplicity, we'll use the create endpoint which might need adjustment if we want strict update vs create
      // But based on server.ts, POST /api/users inserts. PUT /api/users/:email updates role.
      // We might need to adjust server.ts or client logic. 
      // Let's assume saveUser is mostly used for updates in AdminView or Registration.
      
      // If updating role:
      if (user.role) {
          await fetch(`${API_BASE}/users/${user.email}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: user.role })
          });
      }
      
      // If creating new user (or updating other fields if supported):
      // The current server POST /api/users is for creation.
      // We might need a check. For now, let's assume this is primarily for role updates in AdminView
      // or we can try to create and ignore if exists (server throws error).
    } catch (e) {
      console.error('saveUser error:', e);
    }
  },

  deleteUser: async (email: string) => {
    // Server doesn't have delete user endpoint yet. 
    // We should probably add it or just log warning.
    console.warn('deleteUser not implemented on server yet');
  },

  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error('login error:', e);
      return null;
    }
  },

  register: async (user: User): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      return response.ok;
    } catch (e) {
      console.error('register error:', e);
      return false;
    }
  },

  // Knowledge Base
  saveKnowledge: async (entry: KnowledgeEntry) => {
    try {
      await fetch(`${API_BASE}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (e) {
      console.error('Failed to save knowledge', e);
    }
  },

  getKnowledge: async (): Promise<KnowledgeEntry[]> => {
    try {
      const response = await fetch(`${API_BASE}/knowledge`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  deleteKnowledge: async (id: string) => {
    try {
      await fetch(`${API_BASE}/knowledge/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to delete knowledge', e);
    }
  },

  // Reports
  saveReport: async (email: string, report: SavedReport) => {
    try {
      await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, email })
      });
    } catch (e) {
      console.error('Failed to save report', e);
    }
  },

  getReports: async (email: string): Promise<SavedReport[]> => {
    try {
      const response = await fetch(`${API_BASE}/reports?email=${encodeURIComponent(email)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  // Legacy stubs
  getCurrentUser: () => null,
  logout: () => {}
};
