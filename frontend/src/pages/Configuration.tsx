import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  ArrowLeft,
  Save,
  Bell,
  Database,
  Lock,
  Mail,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

const Configuration: React.FC = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState({
    // Notifications
    email_enabled: true,
    sms_enabled: false,
    notification_rappels: true,
    notification_prescriptions: true,
    
    // Système
    maintenance_mode: false,
    debug_mode: false,
    backup_auto: true,
    backup_frequency: '24',
    
    // Sécurité
    session_timeout: '30',
    password_min_length: '8',
    require_2fa: false,
    max_login_attempts: '5',
    
    // Général
    language: 'fr',
    timezone: 'Indian/Antananarivo',
    date_format: 'DD/MM/YYYY'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch('/configuration', {
        method: 'PUT',
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
                  <p className="text-gray-600">Paramètres généraux du système</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-300 rounded-lg p-4"
          >
            <p className="text-green-800 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Configuration sauvegardée avec succès !
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4"
          >
            <p className="text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Activer les notifications par email</span>
                <input
                  type="checkbox"
                  name="email_enabled"
                  checked={config.email_enabled}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Activer les notifications par SMS</span>
                <input
                  type="checkbox"
                  name="sms_enabled"
                  checked={config.sms_enabled}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Rappels automatiques de rendez-vous</span>
                <input
                  type="checkbox"
                  name="notification_rappels"
                  checked={config.notification_rappels}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Notifications d'expiration de prescriptions</span>
                <input
                  type="checkbox"
                  name="notification_prescriptions"
                  checked={config.notification_prescriptions}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Système */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Server className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Système</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Mode maintenance</span>
                <input
                  type="checkbox"
                  name="maintenance_mode"
                  checked={config.maintenance_mode}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Mode debug</span>
                <input
                  type="checkbox"
                  name="debug_mode"
                  checked={config.debug_mode}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Sauvegarde automatique</span>
                <input
                  type="checkbox"
                  name="backup_auto"
                  checked={config.backup_auto}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </label>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence des sauvegardes (heures)
                </label>
                <input
                  type="number"
                  name="backup_frequency"
                  value={config.backup_frequency}
                  onChange={handleChange}
                  min="1"
                  max="168"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Lock className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout de session (minutes)
                </label>
                <input
                  type="number"
                  name="session_timeout"
                  value={config.session_timeout}
                  onChange={handleChange}
                  min="5"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longueur minimale du mot de passe
                </label>
                <input
                  type="number"
                  name="password_min_length"
                  value={config.password_min_length}
                  onChange={handleChange}
                  min="6"
                  max="32"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tentatives de connexion max
                </label>
                <input
                  type="number"
                  name="max_login_attempts"
                  value={config.max_login_attempts}
                  onChange={handleChange}
                  min="3"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Authentification à deux facteurs (2FA)</span>
                <input
                  type="checkbox"
                  name="require_2fa"
                  checked={config.require_2fa}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>
            </div>
          </div>

          {/* Général */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Globe className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Paramètres généraux</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
                <select
                  name="language"
                  value={config.language}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="fr">Français</option>
                  <option value="mg">Malagasy</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuseau horaire</label>
                <select
                  name="timezone"
                  value={config.timezone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Indian/Antananarivo">Antananarivo (EAT)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format de date</label>
                <select
                  name="date_format"
                  value={config.date_format}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                  <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                  <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuration;

