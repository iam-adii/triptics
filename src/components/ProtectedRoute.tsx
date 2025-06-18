import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  pageId?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ pageId, children }) => {
  const { isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (pageId && !hasPermission(pageId)) {
    // Redirect to access denied if user doesn't have permission
    return <Navigate to="/access-denied" replace />;
  }

  // Render children or outlet
  return <>{children || <Outlet />}</>;
}; 