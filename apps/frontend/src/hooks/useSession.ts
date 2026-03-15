import { useState, useEffect } from 'react';
import { User } from '../types';

export const useSession = () => {
  const [user, setUser] = useState<User | null>(null);

  // Check for existing session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse user session', e);
        localStorage.removeItem('user');
        localStorage.removeItem('session_id');
      }
    }
  }, []);

  // Persist user on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.session_id) {
        localStorage.setItem('session_id', user.session_id);
      }
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('session_id');
    }
  }, [user]);

  const login = (loggedInUser: User) => {
    if (loggedInUser.session_id) {
      localStorage.setItem('session_id', loggedInUser.session_id);
    }
    setUser(loggedInUser);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('session_id');
    setUser(null);
  };

  return { user, setUser, login, logout };
};
