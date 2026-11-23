import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, user, token } = useAuth();

  // Vérification plus robuste de l'authentification
  if (!isAuthenticated || !token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
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
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
