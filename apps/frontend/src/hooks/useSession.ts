import { useState, useEffect } from 'react';
import { User } from '../types';

export const useSession = () => {
  const [user, setUser] = useState<User | null>(null);

  // Check for existing session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('superfc_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse user session', e);
        localStorage.removeItem('superfc_user');
      }
    }
  }, []);

  // Persist user on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('superfc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('superfc_user');
    }
  }, [user]);

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const logout = () => {
    setUser(null);
  };

  return { user, setUser, login, logout };
};
