
import { SavedReport, User, KnowledgeEntry } from '../types';

const REPORTS_KEY_PREFIX = 'fire_search_reports_';
const USERS_KEY = 'super_fc_users';
const KNOWLEDGE_KEY = 'super_fc_knowledge';

export const storageService = {
  // User Management
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (!data) {
        // Initialize default admin if no users exist
        const defaultAdmin: User = {
          email: 'admin@bfp.gov.ph',
          name: 'Super Admin',
          role: 'admin',
          password: 'admin' // In a real app, this would be hashed
        };
        localStorage.setItem(USERS_KEY, JSON.stringify([defaultAdmin]));
        return [defaultAdmin];
      }
      
      const users = JSON.parse(data);
      // Ensure default admin always exists for recovery/testing
      if (!users.find((u: User) => u.email === 'admin@bfp.gov.ph')) {
         const defaultAdmin: User = {
          email: 'admin@bfp.gov.ph',
          name: 'Super Admin',
          role: 'admin',
          password: 'admin'
        };
        users.push(defaultAdmin);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
      return users;
    } catch (e) {
      return [];
    }
  },

  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);
    
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (email: string) => {
    const users = storageService.getUsers();
    const updated = users.filter(u => u.email !== email);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  },

  login: (email: string, password: string): User | null => {
    const users = storageService.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    return user ? { ...user, password: '' } : null; // Don't return password
  },

  register: (user: User): boolean => {
    const users = storageService.getUsers();
    if (users.some(u => u.email === user.email)) return false;
    
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  },

  // Knowledge Base
  saveKnowledge: (entry: KnowledgeEntry) => {
    try {
      const entries = storageService.getKnowledge();
      entries.unshift(entry);
      localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save knowledge', e);
    }
  },

  getKnowledge: (): KnowledgeEntry[] => {
    try {
      const data = localStorage.getItem(KNOWLEDGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  deleteKnowledge: (id: string) => {
    try {
      const entries = storageService.getKnowledge();
      const updated = entries.filter(e => e.id !== id);
      localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete knowledge', e);
    }
  },

  // Reports
  saveReport: (email: string, report: SavedReport) => {
    try {
      const key = `${REPORTS_KEY_PREFIX}${email}`;
      const reports = JSON.parse(localStorage.getItem(key) || '[]');
      reports.unshift(report); // Add to top
      localStorage.setItem(key, JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save report locally', e);
    }
  },

  getReports: (email: string): SavedReport[] => {
    try {
      const key = `${REPORTS_KEY_PREFIX}${email}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  },

  // Legacy stubs for compatibility
  getCurrentUser: () => null,
  
  logout: () => {}
};
