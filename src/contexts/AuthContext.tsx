"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  dataBalance: number;
  pivotPoints: number;
  password?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'email';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, phone: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('pivot_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - in production, this would call an API
    if (email && password) {
      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        email: email,
        phone: '+1 234 567 8900',
        dataBalance: 15.5, // GB
        pivotPoints: 1250,
        password: password, // In production, never store plain text passwords
        twoFactorEnabled: false,
        twoFactorMethod: 'sms'
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('pivot_user', JSON.stringify(mockUser));
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    // Mock signup - in production, this would call an API
    if (name && email && password && phone) {
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        email: email,
        phone: phone,
        dataBalance: 20.0, // GB - welcome bonus
        pivotPoints: 500, // Welcome pivot points
        password: password,
        twoFactorEnabled: false,
        twoFactorMethod: 'sms'
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('pivot_user', JSON.stringify(mockUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('pivot_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('pivot_user', JSON.stringify(updatedUser));
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;
    
    // Verify current password
    if (user.password !== currentPassword) {
      return false;
    }

    // Update password
    updateUser({ password: newPassword });
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated, updateUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}