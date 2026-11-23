import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, user, token } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Vérification initiale de l'authentification
    const checkAuth = () => {
      if (!isAuthenticated || !token || !user) {
        setIsChecking(false);
        return;
      }
      
      // Vérification du rôle si requis
      if (requiredRole && user.role !== requiredRole) {
        setIsChecking(false);
        return;
      }
      
      setIsChecking(false);
    };

    // Petit délai pour laisser le contexte se stabiliser
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, token, user, requiredRole]);

  // Affichage de chargement pendant la vérification
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Redirection si pas authentifié
  if (!isAuthenticated || !token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Redirection si mauvais rôle
  if (requiredRole && user.role !== requiredRole) {
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

export default AuthGuard;
