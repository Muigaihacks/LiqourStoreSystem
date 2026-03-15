import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { authApi, setAuthToken, setApiBranchId, AuthUser, AuthProfile } from '../services/api';

const TOKEN_KEY = 'liquor_store_token';

interface AuthContextType {
  user: AuthUser | null;
  profiles: AuthProfile[];
  selectedProfile: AuthProfile | null;
  setSelectedProfile: (profile: AuthProfile) => void;
  isAuthenticated: boolean;
  hasManagement: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [selectedProfile, setSelectedProfileState] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSelectedProfile = (profile: AuthProfile) => {
    setSelectedProfileState(profile);
    setApiBranchId(profile.branch_id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('liquor_store_branch_id', String(profile.branch_id));
    }
  };

  const hasManagement = useMemo(
    () => profiles.some((p) => p.can_use_management_module),
    [profiles]
  );

  // Restore session on load: token in localStorage -> me()
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    setAuthToken(token);
    authApi
      .me()
      .then((res) => {
        setUser(res.data.user);
        setProfiles(res.data.profiles);
        const savedBranchId = localStorage.getItem('liquor_store_branch_id');
        const selected =
          res.data.profiles.find((p) => String(p.branch_id) === savedBranchId) ||
          res.data.profiles[0];
        setSelectedProfileState(selected);
        setApiBranchId(selected.branch_id);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(username.trim(), password);
      const { token, user: u, profiles: p } = res.data;
      localStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
      setUser(u);
      setProfiles(p);
      const savedBranchId = localStorage.getItem('liquor_store_branch_id');
      const selected = p.find((pr) => String(pr.branch_id) === savedBranchId) || p[0];
      setSelectedProfileState(selected);
      setApiBranchId(selected.branch_id);
      return true;
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.response?.data?.detail || 'Invalid username or password';
      setError(Array.isArray(msg) ? msg[0] : msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setApiBranchId(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('liquor_store_branch_id');
    setUser(null);
    setProfiles([]);
    setSelectedProfileState(null);
    setError(null);
    authApi.logout().catch(() => {});
  };

  const value: AuthContextType = {
    user,
    profiles,
    selectedProfile,
    setSelectedProfile,
    isAuthenticated: !!user,
    hasManagement,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
