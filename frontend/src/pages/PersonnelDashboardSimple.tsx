import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  UserPlus,
  Phone,
  Mail,
  Activity,
  FileText,
  Bell,
  Users
} from 'lucide-react';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { usePermissions } from '../hooks/usePermissions';
import { apiFetch } from '../utils/apiFetch';

interface PersonnelStats {
  rdvAujourdhui: number;
  rdvConfirme: number;
  rdvEnAttente: number;
  rdvAnnule: number;
  patientsArrives: number;
  consultationsEnCours: number;
}

interface RendezVous {
  id: number;
  patient: string;
  medecin: string;
  heure: string;
  statut: 'en_attente' | 'confirme' | 'en_cours' | 'termine' | 'annule';
  motif: string;
  telephone: string;
}

const PersonnelDashboardSimple: React.FC = () => {
  const [stats, setStats] = useState<PersonnelStats | null>(null);
  const [rdv, setRdv] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rdv');
  const [searchTerm, setSearchTerm] = useState('');
  const permissions = usePermissions();

  useEffect(() => {
    fetchPersonnelStats();
    fetchRdvAujourdhui();
  }, []);

  const fetchPersonnelStats = async () => {
    try {
      const response = await apiFetch('/statistiques/personnel');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRdvAujourdhui = async () => {
    try {
      const response = await apiFetch('/rendez-vous/du-jour');
      const data = await response.json();
      setRdv(data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des RDV:', error);
    }
  };

  const handleConfirmRDV = (rdvId: number) => {
    console.log('Confirmer RDV:', rdvId);
    // Logique pour confirmer un RDV
  };

  const handleCancelRDV = (rdvId: number) => {
    console.log('Annuler RDV:', rdvId);
    // Logique pour annuler un RDV
  };

  const handleCheckIn = (rdvId: number) => {
    console.log('Check-in RDV:', rdvId);
    // Logique pour enregistrer l'arrivée
  };

  const filteredRdv = (Array.isArray(rdv) ? rdv : []).filter(rdvItem =>
    (rdvItem?.patient || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rdvItem?.medecin || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'rdv', label: 'Rendez-vous', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'rapports', label: 'Rapports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleBasedNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Portail Personnel</h1>
          <p className="text-gray-600">Gestion des rendez-vous et accueil des patients</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">RDV Aujourd'hui</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.rdvAujourdhui || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Confirmés</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.rdvConfirme || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
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
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.rdvEnAttente || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
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
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.consultationsEnCours || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
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
                      ? 'bg-purple-100 text-purple-700'
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
        {activeTab === 'rdv' && (
          <div className="space-y-6">
            {/* Recherche et filtres */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher par patient ou médecin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Filtrer
                </button>
              </div>
            </div>

            {/* Liste des RDV */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Rendez-vous du jour</h3>
                <p className="text-sm text-gray-600">Gérez les rendez-vous et l'accueil des patients</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {filteredRdv.map((rdvItem) => (
                    <motion.div
                      key={rdvItem.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{rdvItem.patient}</h4>
                          <p className="text-sm text-gray-600">{rdvItem.medecin}</p>
                          <p className="text-sm text-gray-500">{rdvItem.motif}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{rdvItem.heure}</span>
                            <span className="text-sm text-gray-500">{rdvItem.telephone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rdvItem.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                          rdvItem.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                          rdvItem.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                          rdvItem.statut === 'termine' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rdvItem.statut === 'en_attente' ? 'En attente' :
                           rdvItem.statut === 'confirme' ? 'Confirmé' :
                           rdvItem.statut === 'en_cours' ? 'En cours' :
                           rdvItem.statut === 'termine' ? 'Terminé' : 'Annulé'}
                        </span>
                        <div className="flex space-x-2">
                          {rdvItem.statut === 'en_attente' && (
                            <>
                              <button
                                onClick={() => handleConfirmRDV(rdvItem.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => handleCancelRDV(rdvItem.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                          {rdvItem.statut === 'confirme' && (
                            <button
                              onClick={() => handleCheckIn(rdvItem.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion des Patients</h3>
            <p className="text-gray-600">Interface de gestion des patients - En développement</p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            <p className="text-gray-600">Interface des notifications - En développement</p>
          </div>
        )}

        {activeTab === 'rapports' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rapports</h3>
            <p className="text-gray-600">Interface des rapports - En développement</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonnelDashboardSimple;
