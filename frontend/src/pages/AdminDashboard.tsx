import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Building2,
  Users,
  Calendar,
  Activity,
  Settings,
  UserPlus,
  FileText,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Stethoscope,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Eye,
  Plus,
  Filter,
  Search,
  Bell,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface CentreStats {
  centre: {
    id: number;
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
    region: string;
  };
  patients: number;
  medecins: number;
  rdvAujourdhui: number;
  rdvConfirme: number;
  rdvEnAttente: number;
  consultationsTerminees: number;
  consultationsEnCours: number;
  tauxOccupation: number;
  medecinsList: Array<{
    id: number;
    nom: string;
    prenom: string;
    specialite: string;
    statut: 'actif' | 'inactif';
    derniere_activite: string;
  }>;
  patientsRecents: Array<{
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    date_inscription: string;
  }>;
  rdvAujourdhuiList: Array<{
    id: number;
    patient: string;
    medecin: string;
    heure: string;
    statut: string;
    motif: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<CentreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState((location.state as any)?.activeTab || 'overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMedecinForm, setShowNewMedecinForm] = useState(false);

  // Filtres pour les RDV
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    fetchCentreStats();
  }, []);

  const fetchCentreStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      const centreId = userData?.id_centre || 1;

      const response = await fetch(`/api/statistiques/centre?centre_id=${centreId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Stats centre recues:', data);
      setStats(data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useLogout();

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const token = localStorage.getItem('token');
      // Utiliser les bonnes routes : /export pour CSV, /export-pdf pour PDF
      const endpoint = format === 'csv'
        ? '/api/statistiques/export?scope=centre'
        : '/api/statistiques/export-pdf?scope=centre';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-centre.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        console.error('Erreur lors de l\'export:', errorData.message || 'Erreur inconnue');
        alert(`Erreur lors de l'export : ${errorData.message || 'Veuillez réessayer'}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur de connexion lors de l\'export. Vérifiez que le serveur est démarré.');
    }
  };

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

  const handleCreateMedecin = () => {
    navigate('/medecins/nouveau', {
      state: {
        returnPath: '/admin/dashboard',
        returnTab: 'medecins'
      }
    });
  };

  const handleMedecinStatusChange = (medecinId: number, newStatus: 'actif' | 'inactif') => {
    // Logique pour changer le statut du médecin
    console.log('Changer statut médecin:', medecinId, newStatus);
  };

  const handleCreatePatient = () => {
    navigate('/patients/nouveau');
  };

  const handleCreateRDV = () => {
    navigate('/rendez-vous/nouveau');
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medecins', label: 'Médecins', icon: Stethoscope },
    { id: 'rdv', label: 'Rendez-vous', icon: Calendar },
    { id: 'rapports', label: 'Rapports', icon: FileText },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {stats?.centre?.nom || 'Centre de Santé'}
                </h1>
                <p className="text-gray-600">Administration du centre</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreatePatient}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nouveau patient</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                <span>Rapport</span>
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
        {/* Onglets */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
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
                    <p className="text-sm font-medium text-gray-600">Patients</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.patients || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-600">Médecins</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.medecins || 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-600">RDV Aujourd'hui</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.rdvAujourdhui || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
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
                    <p className="text-sm font-medium text-gray-600">Taux Occupation</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.tauxOccupation || 0}%</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Statistiques détaillées */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-xl shadow-sm border"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendez-vous du jour</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">Confirmés</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{stats?.rdvConfirme || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium">En attente</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">{stats?.rdvEnAttente || 0}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white p-6 rounded-xl shadow-sm border"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultations</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium">En cours</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{stats?.consultationsEnCours || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">Terminées</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{stats?.consultationsTerminees || 0}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Graphiques visuels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique RDV par statut */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-white p-6 rounded-xl shadow-sm border"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendez-vous par statut</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: 'Confirmés', value: stats?.rdvConfirme || 0, fill: '#10b981' },
                    { name: 'En attente', value: stats?.rdvEnAttente || 0, fill: '#f59e0b' },
                    { name: 'En cours', value: stats?.consultationsEnCours || 0, fill: '#3b82f6' },
                    { name: 'Terminés', value: stats?.consultationsTerminees || 0, fill: '#22c55e' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Graphique circulaire occupation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white p-6 rounded-xl shadow-sm border"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Taux d'occupation</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Occupé', value: stats?.tauxOccupation || 0, fill: '#3b82f6' },
                        { name: 'Disponible', value: 100 - (stats?.tauxOccupation || 0), fill: '#e5e7eb' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${entry.value}%`}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Actions rapides */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="bg-white p-6 rounded-xl shadow-sm border"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleCreatePatient}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">Nouveau patient</p>
                    <p className="text-sm text-gray-600">Enregistrer un patient</p>
                  </div>
                </button>
                <button
                  onClick={handleCreateRDV}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Nouveau RDV</p>
                    <p className="text-sm text-gray-600">Planifier un rendez-vous</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium">Générer rapport</p>
                    <p className="text-sm text-gray-600">Exporter les données</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Autres onglets */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* En-tête avec actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gestion des Patients</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un patient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => navigate('/patients/nouveau', {
                      state: {
                        returnPath: '/admin/dashboard',
                        returnTab: 'patients'
                      }
                    })}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouveau patient</span>
                  </button>
                </div>
              </div>

              {/* Statistiques des patients */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Total Patients</p>
                      <p className="text-2xl font-bold text-blue-900">{stats?.patients || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Nouveaux ce mois</p>
                      <p className="text-2xl font-bold text-green-900">
                        {stats?.patientsRecents.length || 0}
                      </p>
                    </div>
                    <UserPlus className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">RDV Aujourd'hui</p>
                      <p className="text-2xl font-bold text-purple-900">{stats?.rdvAujourdhui || 0}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Taux Occupation</p>
                      <p className="text-2xl font-bold text-orange-900">{stats?.tauxOccupation || 0}%</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Patients récents */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h4 className="text-lg font-semibold text-gray-900">Patients Récents</h4>
                <p className="text-sm text-gray-600">Derniers patients inscrits dans votre centre</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats?.patientsRecents
                    .filter((patient: any) =>
                      patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      patient.prenom.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((patient) => (
                      <motion.div
                        key={patient.id}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {patient.prenom} {patient.nom}
                            </h5>
                            <p className="text-sm text-gray-600">{patient.telephone}</p>
                            <p className="text-xs text-gray-500">
                              Inscrit le: {patient.date_inscription}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/patients/${patient.id}/modifier`, {
                              state: {
                                returnPath: '/admin/dashboard',
                                returnTab: 'patients'
                              }
                            })}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medecins' && (
          <div className="space-y-6">
            {/* En-tête avec actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gestion des Médecins</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un médecin..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleCreateMedecin}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouveau médecin</span>
                  </button>
                </div>
              </div>

              {/* Statistiques des médecins */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Total Médecins</p>
                      <p className="text-2xl font-bold text-blue-900">{stats?.medecins || 0}</p>
                    </div>
                    <Stethoscope className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Actifs</p>
                      <p className="text-2xl font-bold text-green-900">
                        {(Array.isArray(stats?.medecinsList) ? stats.medecinsList : []).filter((m: any) => m.statut === 'actif').length || 0}
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600">Inactifs</p>
                      <p className="text-2xl font-bold text-red-900">
                        {(Array.isArray(stats?.medecinsList) ? stats.medecinsList : []).filter((m: any) => m.statut === 'inactif').length || 0}
                      </p>
                    </div>
                    <UserX className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des médecins */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h4 className="text-lg font-semibold text-gray-900">Liste des Médecins</h4>
                <p className="text-sm text-gray-600">Gérez les médecins de votre centre</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats?.medecinsList
                    .filter((medecin: any) =>
                      medecin.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      medecin.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      medecin.specialite.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((medecin) => (
                      <motion.div
                        key={medecin.id}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Stethoscope className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">
                              Dr. {medecin.prenom} {medecin.nom}
                            </h5>
                            <p className="text-sm text-gray-600">{medecin.specialite}</p>
                            <p className="text-xs text-gray-500">
                              Dernière activité: {medecin.derniere_activite}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${medecin.statut === 'actif'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {medecin.statut === 'actif' ? 'Actif' : 'Inactif'}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/medecins/${medecin.id}`)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/medecins/${medecin.id}/modifier`, {
                                state: {
                                  returnPath: '/admin/dashboard',
                                  returnTab: 'medecins'
                                }
                              })}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMedecinStatusChange(
                                medecin.id,
                                medecin.statut === 'actif' ? 'inactif' : 'actif'
                              )}
                              className={`${medecin.statut === 'actif'
                                ? 'text-red-600 hover:text-red-800'
                                : 'text-green-600 hover:text-green-800'
                                }`}
                            >
                              {medecin.statut === 'actif' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rdv' && (
          <div className="space-y-6">
            {/* En-tête avec actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gestion des Rendez-vous</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un RDV..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={handleCreateRDV}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouveau RDV</span>
                  </button>
                </div>
              </div>

              {/* Statistiques des RDV */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">RDV Aujourd'hui</p>
                      <p className="text-2xl font-bold text-purple-900">{stats?.rdvAujourdhui || 0}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Confirmés</p>
                      <p className="text-2xl font-bold text-green-900">{stats?.rdvConfirme || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600">En attente</p>
                      <p className="text-2xl font-bold text-yellow-900">{stats?.rdvEnAttente || 0}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">En cours</p>
                      <p className="text-2xl font-bold text-blue-900">{stats?.consultationsEnCours || 0}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* RDV du jour */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Rendez-vous du jour</h4>
                    <p className="text-sm text-gray-600">Liste des rendez-vous programmés aujourd'hui</p>
                  </div>
                </div>

                {/* Filtres */}
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Rechercher patient ou médecin..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <select
                      value={filterStatut}
                      onChange={(e) => setFilterStatut(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="tous">Tous les statuts</option>
                      <option value="confirme">Confirmé</option>
                      <option value="en_attente">En attente</option>
                      <option value="en_cours">En cours</option>
                      <option value="termine">Terminé</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatut('tous');
                      setFilterDate('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats?.rdvAujourdhuiList
                    .filter((rdv: any) => {
                      // Filtre par recherche
                      const matchesSearch = rdv.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        rdv.medecin.toLowerCase().includes(searchTerm.toLowerCase());

                      // Filtre par statut
                      const matchesStatut = filterStatut === 'tous' || rdv.statut === filterStatut;

                      return matchesSearch && matchesStatut;
                    })
                    .map((rdv) => {
                      // Parser le motif qui peut être un JSON
                      let motifText = 'Consultation';
                      try {
                        if (rdv.motif) {
                          if (typeof rdv.motif === 'string') {
                            const motifData = JSON.parse(rdv.motif);
                            motifText = motifData.motif || motifData.symptomes || 'Consultation';
                          } else if (typeof rdv.motif === 'object' && rdv.motif.motif) {
                            motifText = rdv.motif.motif;
                          } else {
                            motifText = rdv.motif.toString();
                          }
                        }
                      } catch (e) {
                        // Si le parsing échoue, utiliser tel quel
                        motifText = rdv.motif || 'Consultation';
                      }

                      return (
                        <motion.div
                          key={rdv.id}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">{rdv.patient}</h5>
                              <p className="text-sm text-gray-600">{rdv.medecin}</p>
                              <p className="text-sm text-gray-500">{motifText}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{rdv.heure}</p>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rdv.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                                rdv.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                                  rdv.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {rdv.statut === 'confirme' ? 'Confirmé' :
                                  rdv.statut === 'en_attente' ? 'En attente' :
                                    rdv.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => navigate(`/rendez-vous/${rdv.id}`)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/rendez-vous/${rdv.id}/modifier`)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Rapports */}
        {activeTab === 'rapports' && (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Rapports et Analyses</h2>
              <p className="text-blue-100">Générez des rapports détaillés et exportez vos données</p>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Patients</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.patients || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">RDV ce mois</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.rdvAujourdhui ? stats.rdvAujourdhui * 30 : 0}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Médecins Actifs</p>
                    <p className="text-2xl font-bold text-purple-600">{stats?.medecins || 0}</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taux Occupation</p>
                    <p className="text-2xl font-bold text-orange-600">{stats?.tauxOccupation || 0}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Types de rapports */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-xl shadow-sm border-2 border-blue-100 p-6 cursor-pointer hover:border-blue-300 transition-all"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Rapport Patients</h3>
                    <p className="text-xs text-gray-500">Détails complets</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Liste complète des patients avec informations démographiques, historique médical et statistiques de consultation
                </p>
                <ul className="text-xs text-gray-500 mb-4 space-y-1">
                  <li>• Données démographiques</li>
                  <li>• Historique consultations</li>
                  <li>• Statistiques par âge/sexe</li>
                </ul>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Télécharger CSV
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-xl shadow-sm border-2 border-green-100 p-6 cursor-pointer hover:border-green-300 transition-all"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Rapport RDV</h3>
                    <p className="text-xs text-gray-500">Analyses détaillées</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Analyse complète des rendez-vous : taux de présence, motifs fréquents, et performance des consultations
                </p>
                <ul className="text-xs text-gray-500 mb-4 space-y-1">
                  <li>• RDV par période</li>
                  <li>• Taux de présence</li>
                  <li>• Motifs de consultation</li>
                </ul>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Télécharger PDF
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-xl shadow-sm border-2 border-purple-100 p-6 cursor-pointer hover:border-purple-300 transition-all"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Performance Centre</h3>
                    <p className="text-xs text-gray-500">KPIs et métriques</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Indicateurs de performance : taux d'occupation, temps d'attente moyen, satisfaction patients
                </p>
                <ul className="text-xs text-gray-500 mb-4 space-y-1">
                  <li>• Taux d'occupation</li>
                  <li>• Temps d'attente moyen</li>
                  <li>• Performance médecins</li>
                </ul>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  Télécharger PDF
                </button>
              </motion.div>
            </div>

            {/* Export rapide */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Export Rapide</h3>
                  <p className="text-sm text-gray-600">Exportez vos données en un clic</p>
                </div>
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport('csv')}
                  className="group flex items-center justify-between p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Format CSV</p>
                      <p className="text-xs text-gray-500">Excel, Google Sheets</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="group flex items-center justify-between p-4 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Format PDF</p>
                      <p className="text-xs text-gray-500">Document imprimable</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres du Centre</h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Informations du centre</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Nom: {stats?.centre?.nom || 'N/A'}<br />
                  Adresse: {stats?.centre?.adresse || 'N/A'}<br />
                  Téléphone: {stats?.centre?.telephone || 'N/A'}<br />
                  Email: {stats?.centre?.email || 'N/A'}
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Modifier les informations
                </button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Statistiques</h4>
                <p className="text-sm text-gray-600">
                  Patients: {stats?.patients}<br />
                  Médecins: {stats?.medecins}<br />
                  RDV aujourd'hui: {stats?.rdvAujourdhui}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
