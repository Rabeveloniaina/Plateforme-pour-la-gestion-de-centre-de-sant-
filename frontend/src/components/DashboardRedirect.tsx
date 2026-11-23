import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Composant de redirection automatique vers le bon dashboard selon le rôle
 * Remplace l'ancienne page Dashboard.tsx
 */
export default function DashboardRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Rediriger vers le bon dashboard selon le rôle
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
      // Si le rôle n'est pas reconnu, rediriger vers le login
      return <Navigate to="/login" replace />;
  }
}

