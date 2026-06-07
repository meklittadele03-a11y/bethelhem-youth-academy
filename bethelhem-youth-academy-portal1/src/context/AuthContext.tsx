import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, passwordPlain: string) => Promise<User>;
  register: (userData: {
    fullName: string;
    email: string;
    passwordPlain: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    phone?: string;
  }) => Promise<User>;
  logout: () => void;
  setError: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticate existing token on application boot (Session Persistence)
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('bya_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const userObj = await authService.getCurrentUser();
        setUser(userObj);
      } catch (err: any) {
        console.warn('Session restoration failed. Clearing token.', err);
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, passwordPlain: string): Promise<User> => {
    setError(null);
    try {
      const data = await authService.login(email, passwordPlain);
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Authentication failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData: {
    fullName: string;
    email: string;
    passwordPlain: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    phone?: string;
  }): Promise<User> => {
    setError(null);
    try {
      // In a real frontend-backend register setup without custom models,
      // we make an API call to our new MVC `/api/auth/register` route:
      const response = await authService.register(userData);
      return response.user;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed. Please review credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be called within an AuthProvider root.');
  }
  return context;
}
