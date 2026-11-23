import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Shield, Stethoscope, Building, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginFormData {
  username: string;
  password: string;
  role: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'ministere':
          navigate('/ministere/dashboard');
          break;
        case 'admin_centre':
          navigate('/admin/dashboard');
          break;
        case 'medecin':
          navigate('/medecin/dashboard');
          break;
        case 'personnel':
          navigate('/personnel/dashboard');
          break;
        case 'patient':
          navigate('/patient/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const roles = [
    {
      value: 'ministere',
      label: 'Ministère de la Santé',
      description: 'Administration nationale et statistiques',
      icon: Shield,
      color: 'bg-red-500',
      textColor: 'text-red-500'
    },
    {
      value: 'admin_centre',
      label: 'Administrateur Centre',
      description: 'Gestion du centre de santé',
      icon: Building,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      value: 'medecin',
      label: 'Médecin',
      description: 'Consultations et soins médicaux',
      icon: Stethoscope,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      value: 'personnel',
      label: 'Personnel Centre',
      description: 'Accueil et gestion des RDV',
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      value: 'patient',
      label: 'Patient',
      description: 'Consultation de mes informations',
      icon: User,
      color: 'bg-orange-500',
      textColor: 'text-orange-500'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.role) {
      setError('Veuillez sélectionner un rôle');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Utiliser le contexte d'authentification
      await login(formData.username, formData.password);

      // Attendre un peu pour que le contexte se mette à jour
      setTimeout(() => {
        // Récupérer les données utilisateur depuis le localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');

        // Redirection selon le rôle
        switch (userData.role) {
          case 'ministere':
            navigate('/ministere/dashboard');
            break;
          case 'admin_centre':
            navigate('/admin/dashboard');
            break;
          case 'medecin':
            navigate('/medecin/dashboard');
            break;
          case 'personnel':
            navigate('/personnel/dashboard');
            break;
          case 'patient':
            navigate('/patient/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }, 100);

    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      setError(error.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Section gauche - Sélection du rôle */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Plateforme de Gestion</h1>
              <h2 className="text-xl opacity-90">Centres de Santé</h2>
              <p className="text-blue-100 mt-4">
                Connectez-vous selon votre rôle pour accéder à votre espace dédié
              </p>
            </div>

            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = formData.role === role.value;

                return (
                  <motion.button
                    key={role.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelect(role.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${isSelected
                        ? 'border-white bg-white/20'
                        : 'border-white/30 hover:border-white/50 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${role.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{role.label}</div>
                        <div className="text-sm opacity-80">{role.description}</div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Section droite - Formulaire de connexion */}
          <div className="p-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Connexion
                </h3>
                <p className="text-gray-600">
                  Entrez vos identifiants pour accéder à votre espace
                </p>
              </div>

              {formData.role && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded ${roles.find(r => r.value === formData.role)?.color}`}>
                      {React.createElement(roles.find(r => r.value === formData.role)?.icon || User, { className: "w-4 h-4 text-white" })}
                    </div>
                    <span className="font-medium text-blue-800">
                      {roles.find(r => r.value === formData.role)?.label}
                    </span>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Entrez votre mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !formData.role}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Plateforme développée pour le Ministère de la Santé Publique
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;