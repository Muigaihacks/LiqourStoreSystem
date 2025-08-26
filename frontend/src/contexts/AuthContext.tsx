import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  role: 'admin' | 'employee';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('liquor_store_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('liquor_store_user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simple authentication logic (replace with actual API call)
      if (username === 'admin' && password === 'admin123') {
        const userData: User = { username: 'admin', role: 'admin' };
        setUser(userData);
        localStorage.setItem('liquor_store_user', JSON.stringify(userData));
        return true;
      } else if (username === 'employee' && password === 'emp123') {
        const userData: User = { username: 'employee', role: 'employee' };
        setUser(userData);
        localStorage.setItem('liquor_store_user', JSON.stringify(userData));
        return true;
      } else {
        setError('Invalid username or password');
        return false;
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('liquor_store_user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
