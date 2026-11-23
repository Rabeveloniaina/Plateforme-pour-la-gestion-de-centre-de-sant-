import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { exportStatsCSV, exportStatsPDF } from '../utils/exportUtils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLogout } from '../hooks/useLogout';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Activity, 
  Download, 
  TrendingUp,
  MapPin,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface StatsData {
  totalCentres: number;
  totalPatients: number;
  totalMedecins: number;
  totalConsultations: number;
  consultationsAujourdhui: number;
  tauxOccupation: number;
  regions: Array<{
    id: number;
    nom: string;
    code_region: string;
    centres: number;
    patients: number;
    consultations: number;
    taux_occupation: number;
  }>;
  centres: Array<{
    id: number;
    nom: string;
    region: string;
    patients: number;
    medecins: number;
    rdv_aujourdhui: number;
    taux_occupation: number;
    statut: string;
  }>;
  tendances: {
    consultations_evolution: number;
    patients_evolution: number;
    centres_evolution: number;
  };
}

interface FilterOptions {
  region: string;
  centre: string;
  periode: string;
  dateDebut: string;
  dateFin: string;
}

const MinistereDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<FilterOptions>({
    region: 'all',
    centre: 'all',
    periode: 'aujourdhui',
    dateDebut: '',
    dateFin: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiFetch('/statistiques/ministere');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        await exportStatsCSV('region', 'mois');
      } else {
        await exportStatsPDF('region', 'mois');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur de connexion lors de l\'export. Vérifiez que le serveur est démarré.');
    }
  };

  const handleLogout = useLogout();

  const handleNavigateToCentres = () => {
    navigate('/centres');
  };

  const handleNavigateToUsers = () => {
    navigate('/utilisateurs');
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchStats();
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      region: 'all',
      centre: 'all',
      periode: 'aujourdhui',
      dateDebut: '',
      dateFin: ''
    });
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'regions', label: 'Par Région', icon: MapPin },
    { id: 'centres', label: 'Par Centre', icon: Building2 },
    { id: 'statistiques', label: 'Statistiques', icon: TrendingUp },
    { id: 'administration', label: 'Administration', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ministère de la Santé</h1>
                <p className="text-gray-600">Tableau de bord national</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de filtres */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtres et Recherche</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtres</span>
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                  <select
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les régions</option>
                    {(Array.isArray(stats?.regions) ? stats.regions : []).map((region: any) => (
                      <option key={region.id} value={region.id}>{region.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Centre</label>
                  <select
                    value={filters.centre}
                    onChange={(e) => handleFilterChange('centre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tous les centres</option>
                    {(Array.isArray(stats?.centres) ? stats.centres : []).map((centre: any) => (
                      <option key={centre.id} value={centre.id}>{centre.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
                  <select
                    value={filters.periode}
                    onChange={(e) => handleFilterChange('periode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="aujourdhui">Aujourd'hui</option>
                    <option value="semaine">Cette semaine</option>
                    <option value="mois">Ce mois</option>
                    <option value="annee">Cette année</option>
                    <option value="personnalise">Période personnalisée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                  <input
                    type="date"
                    value={filters.dateDebut}
                    onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                  <input
                    type="date"
                    value={filters.dateFin}
                    onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </motion.div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Centres de Santé</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalCentres || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Patients</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Médecins</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalMedecins || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultations</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalConsultations || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Statistiques du jour */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aujourd'hui</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Consultations</span>
                <span className="font-semibold">{stats?.consultationsAujourdhui || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux d'occupation</span>
                <span className="font-semibold">{stats?.tauxOccupation || 0}%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendances</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Croissance des consultations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Performance des centres</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/centres')}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Voir tous les centres
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded"
              >
                Générer rapport mensuel
              </button>
              <button 
                onClick={() => handleExport('csv')}
                className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded"
              >
                Analyser les performances
              </button>
            </div>
          </motion.div>
        </div>

            {/* Statistiques par région */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl shadow-sm border"
            >
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Statistiques par Région</h3>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-medium text-gray-500">
                        <th className="pb-3">Région</th>
                        <th className="pb-3">Centres</th>
                        <th className="pb-3">Patients</th>
                        <th className="pb-3">Consultations</th>
                        <th className="pb-3">Taux Occupation</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats?.regions.map((region, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-3">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{region.nom}</span>
                            </div>
                          </td>
                          <td className="py-3 text-gray-600">{region.centres}</td>
                          <td className="py-3 text-gray-600">{region.patients}</td>
                          <td className="py-3 text-gray-600">{region.consultations}</td>
                          <td className="py-3 text-gray-600">{region.taux_occupation}%</td>
                          <td className="py-3">
                            <button 
                              onClick={() => console.log('Voir détails région:', region.nom)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Onglet Par Région */}
        {activeTab === 'regions' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse par Région</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {stats?.regions.map((region) => (
                <motion.div
                  key={region.id}
                  whileHover={{ scale: 1.02 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{region.nom}</h4>
                    <span className="text-sm text-gray-500">{region.code_region}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{region.centres}</p>
                      <p className="text-sm text-gray-600">Centres</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{region.patients}</p>
                      <p className="text-sm text-gray-600">Patients</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{region.consultations}</p>
                      <p className="text-sm text-gray-600">Consultations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{region.taux_occupation}%</p>
                      <p className="text-sm text-gray-600">Occupation</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet Par Centre */}
        {activeTab === 'centres' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Gestion des Centres</h3>
              <button 
                onClick={() => navigate('/centres/nouveau')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Centre</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-500">
                    <th className="pb-3">Centre</th>
                    <th className="pb-3">Région</th>
                    <th className="pb-3">Patients</th>
                    <th className="pb-3">Médecins</th>
                    <th className="pb-3">RDV Aujourd'hui</th>
                    <th className="pb-3">Occupation</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats?.centres.map((centre) => (
                    <tr key={centre.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{centre.nom}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{centre.region}</td>
                      <td className="py-3 text-gray-600">{centre.patients}</td>
                      <td className="py-3 text-gray-600">{centre.medecins}</td>
                      <td className="py-3 text-gray-600">{centre.rdv_aujourdhui}</td>
                      <td className="py-3 text-gray-600">{centre.taux_occupation}%</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          centre.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {centre.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate(`/centres/${centre.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/centres/${centre.id}/modifier`)}
                            className="text-green-600 hover:text-green-800"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce centre ? Cette action est irréversible.')) {
                                try {
                                  const response = await api.delete(`/centres/${centre.id}`);
                                  if (response.success) {
                                    alert('Centre supprimé avec succès');
                                    window.location.reload();
                                  }
                                } catch (error: any) {
                                  alert('Erreur lors de la suppression: ' + (error.message || 'Erreur inconnue'));
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Onglet Statistiques */}
        {activeTab === 'statistiques' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendances</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Évolution consultations</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">+{stats?.tendances?.consultations_evolution || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Évolution patients</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-600 font-medium">+{stats?.tendances?.patients_evolution || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Évolution centres</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-purple-600 font-medium">+{stats?.tendances?.centres_evolution || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Globale</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Taux d'occupation moyen</span>
                    <span className="text-2xl font-bold text-orange-600">{stats?.tauxOccupation}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Consultations aujourd'hui</span>
                    <span className="text-2xl font-bold text-green-600">{stats?.consultationsAujourdhui}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total centres actifs</span>
                    <span className="text-2xl font-bold text-blue-600">{stats?.totalCentres}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Administration */}
        {activeTab === 'administration' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Créer un Centre</h3>
                </div>
                <p className="text-gray-600 mb-4">Ajouter un nouveau centre de santé au système</p>
                <button 
                  onClick={() => navigate('/centres/nouveau')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Nouveau Centre
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Gérer les Utilisateurs</h3>
                </div>
                <p className="text-gray-600 mb-4">Administrer les comptes utilisateurs</p>
                <button 
                  onClick={handleNavigateToUsers}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Gérer Utilisateurs
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
                </div>
                <p className="text-gray-600 mb-4">Paramètres du système</p>
                <button 
                  onClick={() => navigate('/configuration')}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Configuration
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinistereDashboard;
