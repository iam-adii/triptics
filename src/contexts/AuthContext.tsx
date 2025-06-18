import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, PagePermission, AuthContextType } from '@/types/localAuth';
import * as authService from '@/services/localAuthService';

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setCurrentUser(storedUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    const user = await authService.login(email, password);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Get all users
  const getUsers = (): User[] => {
    return authService.getUsers();
  };

  // Add a new user
  const addUser = (user: Omit<User, 'id'>) => {
    authService.addUser(user);
  };

  // Update an existing user
  const updateUser = (user: User) => {
    authService.updateUser(user);
    // Update current user if it's the same
    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
      authService.setCurrentUser(user);
    }
  };

  // Delete a user
  const deleteUser = (userId: string) => {
    authService.deleteUser(userId);
  };

  // Get all page permissions
  const getPermissions = (): PagePermission[] => {
    return authService.getPermissions();
  };

  // Update page permissions
  const updatePagePermissions = (pageId: string, roles: UserRole[]) => {
    authService.updatePagePermissions(pageId, roles);
  };

  // Check if current user has permission for a specific page
  const hasPermission = (pageId: string): boolean => {
    if (!currentUser) return false;
    return authService.hasPermission(pageId, currentUser.role);
  };

  // Context value
  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    getPermissions,
    updatePagePermissions,
    hasPermission,
  };

  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 