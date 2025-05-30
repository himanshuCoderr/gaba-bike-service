import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// RoleBasedRoute component that checks for specific role access
export const RoleBasedRoute = ({ children, requiredRole }) => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // For super admin, allow access to everything
  if (userRole === 'superadmin') {
    return children;
  }

  // For sub admin, only allow if specifically permitted or if it's a view-only route
  if (userRole === 'subadmin' && requiredRole === 'subadmin') {
    return children;
  }

  // If none of the above conditions are met, redirect to home or unauthorized page
  return <Navigate to="/" />;
};

// Higher-order component for super admin only routes
export const SuperAdminRoute = ({ children }) => (
  <RoleBasedRoute requiredRole="superadmin">{children}</RoleBasedRoute>
);

// Higher-order component for routes accessible by both super admin and sub admin
export const AdminRoute = ({ children }) => (
  <RoleBasedRoute requiredRole="subadmin">{children}</RoleBasedRoute>
); 