import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/music';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginAsAdmin: (email: string, password?: string) => Promise<void>;
  loginAsListener: (email: string) => Promise<void>;
  setupAdmin: (name: string, email: string) => Promise<void>;
  logout: () => void;
  showAdminAuthModal: boolean;
  setShowAdminAuthModal: (show: boolean) => void;
  showUserAuthModal: boolean;
  setShowUserAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isAdmin, setIsAdmin] = useState<boolean>(Boolean(getStoredToken()));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState<boolean>(false);
  const [showUserAuthModal, setShowUserAuthModal] = useState<boolean>(false);

  useEffect(() => {
    async function verifySession() {
      try {
        const { user: serverUser, role } = await api.getMe();
        if (role === 'admin' && serverUser) {
          setUser(serverUser);
          setIsAdmin(true);
        } else if (user?.role === 'admin' && role !== 'admin') {
          // Token expired or invalid
          setUser(null);
          setIsAdmin(false);
          setStoredToken(null);
          setStoredUser(null);
        }
      } catch {
        // Keep cached state
      } finally {
        setIsLoading(false);
      }
    }
    verifySession();
  }, []);

  const loginAsAdmin = async (email: string, password?: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setIsAdmin(res.user.role === 'admin');
    setShowAdminAuthModal(false);
  };

  const loginAsListener = async (email: string) => {
    const res = await api.login(email);
    setUser(res.user);
    setIsAdmin(false);
    setShowUserAuthModal(false);
  };

  const setupAdmin = async (name: string, email: string) => {
    const res = await api.setupAdmin(name, email);
    setUser(res.user);
    setIsAdmin(true);
    setShowAdminAuthModal(false);
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        loginAsAdmin,
        loginAsListener,
        setupAdmin,
        logout,
        showAdminAuthModal,
        setShowAdminAuthModal,
        showUserAuthModal,
        setShowUserAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
