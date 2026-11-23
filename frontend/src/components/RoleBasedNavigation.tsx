import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  User,
  Stethoscope,
  Building,
  Shield,
  FileText,
  Pill,
  Syringe,
  Bell
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useLogout';

const RoleBasedNavigation: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions();
  const location = useLocation();
  const handleLogout = useLogout();

  const getNavigationItems = () => {
    const role = user?.role;
    
    switch (role) {
      case 'ministere':
        return [
          { path: '/ministere/dashboard', label: 'Tableau de bord', icon: Home },
          { path: '/centres', label: 'Centres de santé', icon: Building },
          { path: '/stats', label: 'Statistiques nationales', icon: BarChart3 },
          { path: '/utilisateurs', label: 'Utilisateurs', icon: Users },
          { path: '/notifications', label: 'Notifications', icon: Bell },
        ];
        
      case 'admin_centre':
        return [
          { path: '/admin/dashboard', label: 'Tableau de bord', icon: Home },
          { path: '/patients', label: 'Patients', icon: Users },
          { path: '/medecins', label: 'Médecins', icon: Stethoscope },
          { path: '/rendez-vous', label: 'Rendez-vous', icon: Calendar },
          { path: '/stats', label: 'Statistiques', icon: BarChart3 },
          { path: '/notifications', label: 'Notifications', icon: Bell },
        ];
        
      case 'medecin':
        return [
          { path: '/medecin/dashboard', label: 'Tableau de bord', icon: Home },
          { path: '/patients', label: 'Mes patients', icon: Users },
          { path: '/rendez-vous', label: 'Mon planning', icon: Calendar },
          { path: '/fiches-medicales', label: 'Fiches médicales', icon: FileText },
          { path: '/prescriptions', label: 'Prescriptions', icon: Pill },
          { path: '/vaccinations', label: 'Vaccinations', icon: Syringe },
        ];
        
      case 'personnel':
        return [
          { path: '/personnel/dashboard', label: 'Tableau de bord', icon: Home },
          { path: '/rendez-vous', label: 'Rendez-vous du jour', icon: Calendar },
          { path: '/patients', label: 'Patients', icon: Users },
          { path: '/notifications', label: 'Notifications', icon: Bell },
        ];
        
      case 'patient':
        return [
          { path: '/patient/dashboard', label: 'Mon espace', icon: Home },
          { path: '/patient/profile', label: 'Mon profil', icon: User },
          { path: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: Calendar },
          { path: '/patient/dossiers', label: 'Mes dossiers', icon: FileText },
        ];
        
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Connecté en tant que <strong>{user?.nom_utilisateur}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default RoleBasedNavigation;
