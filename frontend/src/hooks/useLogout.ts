/**
 * Hook personnalisé pour gérer la déconnexion avec confirmation et redirection
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    // Demander confirmation
    const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    
    if (confirmed) {
      // Appeler la fonction logout du contexte
      logout();
      
      // Rediriger vers la page de connexion
      navigate('/login', { replace: true });
    }
  };

  return handleLogout;
}

