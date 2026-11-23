import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedProps {
  children: React.ReactNode;
  requiredRole: string;
  fallbackPath?: string;
}

const RoleProtected: React.FC<RoleProtectedProps> = ({ 
  children, 
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== requiredRole) {
    // Rediriger vers le bon portail selon le rôle
    switch (user.role) {
      case 'ministere':
        return <Navigate to="/ministere/dashboard" replace />;
      case 'admin_centre':
        return <Navigate to="/admin/dashboard" replace />;
      case 'medecin':
        return <Navigate to="/medecin/dashboard" replace />;
      case 'personnel':
        return <Navigate to="/personnel/dashboard" replace />;
      case 'patient':
        return <Navigate to="/patient/dashboard" replace />;
      default:
        return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default RoleProtected;
