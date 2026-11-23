import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLogout } from '../hooks/useLogout';
import { apiFetch } from '../utils/apiFetch';
import { parseLocalDate, formatDateTimeLocal } from '../utils/dateFormatter';
import CalendarComponent from '../components/Calendar';
import { DonutChart, BarChart, LineChart } from '../components/Charts';
import WalkInModal from '../components/WalkInModal';
import FileAttenteTab from '../components/FileAttenteTab';
import CheckInModal from '../components/CheckInModal';
import CheckInStatus from '../components/CheckInStatus';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle,
  AlertCircle,
  UserPlus,
  Phone,
  Mail,
  LogOut,
  Activity,
  FileText,
  Bell,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Stethoscope,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  ArrowUpDown,
  CalendarClock,
  Timer,
  Zap
} from 'lucide-react';

interface PersonnelStats {
  centre: {
    id: number;
    nom: string;
    adresse: string;
    telephone: string;
  };
  rdvAujourdhui: number;
  rdvConfirme: number;
  rdvEnAttente: number;
  rdvAnnule: number;
  patientsArrives: number;
  consultationsEnCours: number;
  medecinsDisponibles: Array<{
    id: number;
    nom: string;
    prenom: string;
    specialite: string;
    statut: 'disponible' | 'en_consultation' | 'pause' | 'indisponible';
    prochainPatient: string | null;
  }>;
}

interface RendezVous {
  id?: number;
  id_rdv?: number;
  patient?: string;
  patient_nom?: string;
  patient_prenom?: string;
  patient_id?: number;
  medecin?: string;
  medecin_nom?: string;
  medecin_prenom?: string;
  medecin_id?: number;
  heure?: string;
  heure_rdv?: string;
  date_rdv?: string;
  heure_arrivee?: string;
  statut: 'en_attente' | 'attente' | 'confirme' | 'en_cours' | 'termine' | 'annule';
  motif?: string;
  telephone?: string;
  patient_telephone?: string;
  duree_estimee?: number;
  centre_id?: number;
}

const PersonnelDashboard: React.FC = () => {
  // Tous les hooks doivent être déclarés au début du composant
  const [stats, setStats] = useState<PersonnelStats | null>(null);
  const [rdv, setRdv] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rdv');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showAssignPatientModal, setShowAssignPatientModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [medecins, setMedecins] = useState<any[]>([]);
  const [reajustementModal, setReajustementModal] = useState(false);
  const [rdvAReajuster, setRdvAReajuster] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [rdvToCheckIn, setRdvToCheckIn] = useState<any>(null);
  const { showToast } = useToast();
  const handleLogout = useLogout();

  useEffect(() => {
    fetchPersonnelStats();
    fetchRdvAujourdhui();
    fetchRendezVousForCalendar();
  }, []);

  const fetchRendezVousForCalendar = async () => {
    try {
      const response = await apiFetch('/rendez-vous/du-jour');
      const data = await response.json();
      
      // Transformer les RDV en événements calendrier
      const events = (data.data || []).map((rdv: any) => {
        // Utiliser parseLocalDate pour parser la date en LOCAL (pas UTC)
        const dateRdv = parseLocalDate(rdv.date_rdv) || new Date();
        const duree = rdv.duree_estimee || 30;
        
        return {
          id: rdv.id_rdv || rdv.id,
          title: `${rdv.patient_prenom || ''} ${rdv.patient_nom || ''}`.trim() || 'Patient',
          start: dateRdv,
          end: new Date(dateRdv.getTime() + duree * 60000),
          patientName: `${rdv.patient_prenom || ''} ${rdv.patient_nom || ''}`.trim(),
          medecinName: `${rdv.medecin_prenom || ''} ${rdv.medecin_nom || ''}`.trim(),
          statut: rdv.statut || 'attente',
          type: 'consultation'
        };
      });
      
      setCalendarEvents(events);
    } catch (error) {
      console.error('Erreur chargement RDV pour calendrier:', error);
    }
  };

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

  const fetchPatients = async () => {
    try {
      const response = await apiFetch('/patients?limit=100');
      const data = await response.json();
      setPatients(data.data || []);
    } catch (error) {
      console.error('Erreur chargement patients:', error);
    }
  };

  const fetchMedecins = async () => {
    try {
      const response = await apiFetch('/medecins');
      const data = await response.json();
      setMedecins(data.data || []);
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
    }
  };


  const handleReajustementPlanning = async (rdvId: number, nouvelleHeure: string) => {
    try {
      const response = await apiFetch(`/rendez-vous/reprogrammation/${rdvId}/reprogrammer`, {
        method: 'POST',
        body: JSON.stringify({
          nouvelle_date: nouvelleHeure
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Planning réajusté avec succès', 'success');
        setReajustementModal(false);
        setRdvAReajuster(null);
        fetchRdvAujourdhui();
        fetchPersonnelStats();
        fetchRendezVousForCalendar();
      } else {
        showToast(`Erreur: ${data.message}`, 'error');
      }
    } catch (error: any) {
      console.error('Erreur réajustement:', error);
      showToast('Erreur lors du réajustement du planning', 'error');
    }
  };

  const handleAutoReajustement = async (medecinId: number) => {
    try {
      // Récupérer les retards pour ce médecin
      const response = await apiFetch(`/rendez-vous/reprogrammation/retards?medecin_id=${medecinId}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        showToast(`${data.data.length} retard(s) détecté(s). Réajustement automatique en cours...`, 'info');
        // Le backend devrait gérer le réajustement automatique
        fetchRdvAujourdhui();
        fetchPersonnelStats();
        fetchRendezVousForCalendar();
      } else {
        showToast('Aucun retard détecté pour ce médecin', 'info');
      }
    } catch (error: any) {
      console.error('Erreur auto-réajustement:', error);
      showToast('Erreur lors du réajustement automatique', 'error');
    }
  };

  const handleConfirmRDV = async (rdvId: number) => {
    try {
      await apiFetch(`/rendez-vous/${rdvId}/confirmer`, {
        method: 'POST',
      });
      await fetchRdvAujourdhui();
      await fetchPersonnelStats();
    } catch (error) {
      console.error('Erreur confirmation RDV:', error);
    }
  };

  const handleCancelRDV = async (rdvId: number) => {
    try {
      await apiFetch(`/rendez-vous/${rdvId}/annuler`, {
        method: 'POST',
      });
      await fetchRdvAujourdhui();
      await fetchPersonnelStats();
    } catch (error) {
      console.error('Erreur annulation RDV:', error);
    }
  };

  const handleMarquerAbsent = async (rdvId: number, patientNom: string) => {
    if (!confirm(`Marquer ${patientNom} comme absent ?`)) {
      return;
    }

    try {
      const response = await apiFetch(`/personnel/file-attente/${rdvId}/marquer-absent`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast(`${patientNom} marqué comme absent`, 'info');
        await fetchRdvAujourdhui();
        await fetchPersonnelStats();
        window.dispatchEvent(new Event('refresh-file-attente'));
      } else {
        throw new Error(data.message || 'Erreur');
      }
    } catch (error: any) {
      console.error('Erreur marquer absent:', error);
      showToast(error.message || 'Erreur lors du marquage absent', 'error');
    }
  };

  const handleCheckIn = (rdvId: number) => {
    // Trouver le RDV - chercher par id_rdv ou id
    const rdvItem = rdv.find(r => r.id_rdv === rdvId || r.id === rdvId);
    
    if (rdvItem) {
      console.log('✅ RDV trouvé pour check-in:', rdvItem);
      setRdvToCheckIn(rdvItem);
      setShowCheckInModal(true);
    } else {
      console.error('❌ RDV non trouvé. ID recherché:', rdvId);
      console.error('❌ RDVs disponibles:', rdv);
      showToast('Rendez-vous non trouvé', 'error');
    }
  };

  const confirmCheckIn = async () => {
    if (!rdvToCheckIn) return;

    try {
      // Utiliser id_rdv en priorité, puis id
      const rdvId = rdvToCheckIn.id_rdv || rdvToCheckIn.id;
      
      if (!rdvId) {
        console.error('❌ ID du RDV non trouvé:', rdvToCheckIn);
        throw new Error('ID du rendez-vous non trouvé');
      }

      console.log('🔍 Check-in RDV ID:', rdvId);
      
      const response = await apiFetch(`/rendez-vous/${rdvId}/checkin`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        const message = data.message || 'Patient enregistré avec succès';
        
        // Afficher notification de réajustement si présent
        if (data.reajustement) {
          showToast(`${message} - ${data.reajustement.message || 'Planning réajusté'}`, 'success');
        } else {
          showToast(message, 'success');
        }

        // Recharger les données
        await Promise.all([
          fetchRdvAujourdhui(),
          fetchPersonnelStats(),
          fetchRendezVousForCalendar()
        ]);
        
        // Rafraîchir la file d'attente si l'onglet est actif
        if (activeTab === 'file-attente') {
          window.dispatchEvent(new Event('refresh-file-attente'));
        }
      } else {
        throw new Error(data.message || 'Échec du check-in');
      }
    } catch (error: any) {
      console.error('Erreur check-in RDV:', error);
      showToast(error.message || 'Erreur lors du check-in', 'error');
      throw error;
    }
  };

  const handleCreatePatient = () => {
    setShowNewPatientModal(true);
  };

  const handleAssignPatient = (rdvId: number) => {
    setShowAssignPatientModal(true);
  };

  const handlePatientEnter = (rdvId: number) => {
    // Logique pour faire entrer un patient
    console.log('Faire entrer patient:', rdvId);
  };

  const handlePatientWait = (rdvId: number) => {
    // Logique pour faire attendre un patient
    console.log('Faire attendre patient:', rdvId);
  };

  // Déclarations avant le return conditionnel
  const filteredRdv = (Array.isArray(rdv) ? rdv : []).filter(rdvItem => {
    const patientName = rdvItem?.patient_prenom && rdvItem?.patient_nom
      ? `${rdvItem.patient_prenom} ${rdvItem.patient_nom}`
      : rdvItem?.patient || '';
    const medecinName = rdvItem?.medecin_prenom && rdvItem?.medecin_nom
      ? `${rdvItem.medecin_prenom} ${rdvItem.medecin_nom}`
      : rdvItem?.medecin || '';
    
    return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           medecinName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const tabs = [
    { id: 'rdv', label: 'Rendez-vous', icon: CalendarIcon },
    { id: 'calendrier', label: 'Calendrier', icon: CalendarIcon },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'medecins', label: 'Médecins', icon: Stethoscope },
    { id: 'file_attente', label: 'File d\'attente', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'rapports', label: 'Rapports', icon: FileText },
  ];

  // Return conditionnel après toutes les déclarations
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Personnel Centre</h1>
                <p className="text-gray-600">Gestion des rendez-vous et accueil</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowWalkInModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <UserPlus className="w-4 h-4" />
                <span>Patient sans RDV</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <CalendarIcon className="w-4 h-4" />
                <span>Nouveau RDV</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
                <CalendarIcon className="w-6 h-6 text-blue-600" />
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
                  {filteredRdv.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucun rendez-vous trouvé</p>
                    </div>
                  ) : (
                    filteredRdv.map((rdvItem) => (
                    <motion.div
                      key={rdvItem.id_rdv || rdvItem.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CalendarIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {rdvItem.patient_prenom && rdvItem.patient_nom
                              ? `${rdvItem.patient_prenom} ${rdvItem.patient_nom}`
                              : rdvItem.patient || 'Patient'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {rdvItem.medecin_prenom && rdvItem.medecin_nom
                              ? `Dr. ${rdvItem.medecin_prenom} ${rdvItem.medecin_nom}`
                              : rdvItem.medecin || 'Médecin'}
                          </p>
                          {rdvItem.motif && (
                            <p className="text-sm text-gray-500">{rdvItem.motif}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              {rdvItem.heure_rdv || rdvItem.heure || (() => {
                                if (rdvItem.date_rdv) {
                                  try {
                                    const date = parseLocalDate(rdvItem.date_rdv);
                                    return date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                                  } catch {
                                    return 'N/A';
                                  }
                                }
                                return 'N/A';
                              })()}
                            </span>
                            {(rdvItem.patient_telephone || rdvItem.telephone) && (
                              <span className="text-sm text-gray-500">
                                {rdvItem.patient_telephone || rdvItem.telephone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rdvItem.statut === 'en_attente' || rdvItem.statut === 'attente' ? 'bg-yellow-100 text-yellow-800' :
                            rdvItem.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                            rdvItem.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                            rdvItem.statut === 'termine' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {rdvItem.statut === 'en_attente' || rdvItem.statut === 'attente' ? 'En attente' :
                             rdvItem.statut === 'confirme' ? 'Confirmé' :
                             rdvItem.statut === 'en_cours' ? 'En cours' :
                             rdvItem.statut === 'termine' ? 'Terminé' : 'Annulé'}
                          </span>
                          <CheckInStatus
                            heureArrivee={rdvItem.heure_arrivee}
                            statut={rdvItem.statut}
                            heureRdv={rdvItem.heure}
                            compact={true}
                          />
                        </div>
                        <div className="flex space-x-2">
                          {(rdvItem.statut === 'en_attente' || rdvItem.statut === 'attente') && (
                            <>
                              <button
                                onClick={() => handleConfirmRDV(rdvItem.id_rdv || rdvItem.id!)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => handleCancelRDV(rdvItem.id_rdv || rdvItem.id!)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                          {rdvItem.statut === 'confirme' && !rdvItem.heure_arrivee && (
                            <>
                              <button
                                onClick={() => handleCheckIn(rdvItem.id_rdv || rdvItem.id!)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Check-in
                              </button>
                              {/* Bouton Marquer absent - Visible si retard > 15 min */}
                              {(() => {
                                try {
                                  const rdvDate = parseLocalDate(rdvItem.date_rdv || rdvItem.heure_rdv);
                                  if (rdvDate) {
                                    const now = new Date();
                                    const diffMinutes = (now.getTime() - rdvDate.getTime()) / (1000 * 60);
                                    if (diffMinutes > 15) {
                                      return (
                                        <button
                                          onClick={() => handleMarquerAbsent(
                                            rdvItem.id_rdv || rdvItem.id!,
                                            rdvItem.patient_prenom && rdvItem.patient_nom
                                              ? `${rdvItem.patient_prenom} ${rdvItem.patient_nom}`
                                              : rdvItem.patient || 'Patient'
                                          )}
                                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-red-100 hover:text-red-700 flex items-center space-x-1"
                                          title="Marquer comme absent"
                                        >
                                          <UserX className="w-4 h-4" />
                                          <span>Absent</span>
                                        </button>
                                      );
                                    }
                                  }
                                } catch (e) {
                                  // Ignorer erreur de parsing
                                }
                                return null;
                              })()}
                              <button
                                onClick={() => {
                                  setRdvAReajuster(rdvItem);
                                  setReajustementModal(true);
                                }}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 flex items-center space-x-1"
                                title="Réajuster l'heure du rendez-vous"
                              >
                                <CalendarClock className="w-3 h-3" />
                                <span>Réajuster</span>
                              </button>
                            </>
                          )}
                          {rdvItem.statut === 'confirme' && rdvItem.heure_arrivee && (
                            <div className="flex items-center space-x-2">
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Patient arrivé</span>
                              </span>
                              <CheckInStatus 
                                heureArrivee={rdvItem.heure_arrivee}
                                mode="compact"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gestion des Patients</h3>
                <button 
                  onClick={handleCreatePatient}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau patient</span>
                </button>
              </div>
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Créez et gérez les patients de votre centre</p>
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={handleCreatePatient}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Créer un patient
                  </button>
                  <button 
                    onClick={() => window.location.href = '/patients'}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Voir tous les patients
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Médecins */}
        {activeTab === 'medecins' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Médecins du Centre</h3>
              <p className="text-sm text-gray-600 mb-6">Vérifiez la disponibilité des médecins en temps réel</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Array.isArray(stats?.medecinsDisponibles) ? stats.medecinsDisponibles : []).map((medecin) => (
                  <motion.div
                    key={medecin.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 border rounded-lg ${
                      medecin.statut === 'disponible' ? 'border-green-200 bg-green-50' :
                      medecin.statut === 'en_consultation' ? 'border-blue-200 bg-blue-50' :
                      medecin.statut === 'pause' ? 'border-yellow-200 bg-yellow-50' :
                      'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          medecin.statut === 'disponible' ? 'bg-green-100' :
                          medecin.statut === 'en_consultation' ? 'bg-blue-100' :
                          medecin.statut === 'pause' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          <Stethoscope className={`w-5 h-5 ${
                            medecin.statut === 'disponible' ? 'text-green-600' :
                            medecin.statut === 'en_consultation' ? 'text-blue-600' :
                            medecin.statut === 'pause' ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Dr. {medecin.prenom} {medecin.nom}
                          </h4>
                          <p className="text-sm text-gray-600">{medecin.specialite}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        medecin.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                        medecin.statut === 'en_consultation' ? 'bg-blue-100 text-blue-800' :
                        medecin.statut === 'pause' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {medecin.statut === 'disponible' ? 'Disponible' :
                         medecin.statut === 'en_consultation' ? 'En consultation' :
                         medecin.statut === 'pause' ? 'En pause' : 'Indisponible'}
                      </span>
                    </div>
                    {medecin.prochainPatient && (
                      <div className="mt-3 p-2 bg-gray-100 rounded text-sm mb-2">
                        <span className="text-gray-600">Prochain patient: </span>
                        <span className="font-medium">{medecin.prochainPatient}</span>
                      </div>
                    )}
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleAutoReajustement(medecin.id)}
                        className="flex-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium flex items-center justify-center space-x-1"
                        title="Réajuster automatiquement le planning"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Réajuster</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Calendrier */}
        {activeTab === 'calendrier' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border overflow-hidden"
          >
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
              <h3 className="text-lg font-semibold text-gray-900">Calendrier des rendez-vous</h3>
              <p className="text-sm text-gray-600">Visualisez tous les rendez-vous du centre en calendrier</p>
            </div>
            <div className="p-6" style={{ minHeight: '600px' }}>
              <CalendarComponent
                events={calendarEvents}
                onEventClick={(event) => {
                  window.location.href = `/rendez-vous/${event.id}`;
                }}
                onDateClick={(date) => {
                  console.log('Date cliquée:', date);
                }}
                view="week"
              />
            </div>
          </motion.div>
        )}

        {/* Onglet File d'attente */}
        {activeTab === 'file_attente' && <FileAttenteTab onRefresh={() => {
          fetchRdvAujourdhui();
          fetchPersonnelStats();
          fetchRendezVousForCalendar();
        }} />}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            <p className="text-gray-600">Interface des notifications à implémenter</p>
          </div>
        )}

        {activeTab === 'rapports' && (
          <div className="space-y-6">
            {/* Graphiques statistiques */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistiques du Centre</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Graphique en donut - Répartition des statuts RDV */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Répartition des statuts de rendez-vous</h4>
                  <DonutChart
                    data={[
                      { 
                        label: 'Confirmés', 
                        value: stats?.rdvConfirme || 0, 
                        color: '#10B981' 
                      },
                      { 
                        label: 'En attente', 
                        value: stats?.rdvEnAttente || 0, 
                        color: '#F59E0B' 
                      },
                      { 
                        label: 'Annulés', 
                        value: stats?.rdvAnnule || 0, 
                        color: '#EF4444' 
                      },
                      { 
                        label: 'Terminés', 
                        value: (stats?.rdvAujourdhui || 0) - (stats?.rdvConfirme || 0) - (stats?.rdvEnAttente || 0) - (stats?.rdvAnnule || 0), 
                        color: '#3B82F6' 
                      }
                    ].filter(item => item.value > 0)}
                    size={220}
                  />
                </div>

                {/* Graphique en barres - Activité par jour de la semaine */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Répartition par jour de la semaine</h4>
                  {(() => {
                    // Calculer les RDV par jour de la semaine
                    const rdvSafe = Array.isArray(rdv) ? rdv : [];
                    const joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
                    const joursData: { label: string; value: number }[] = [];
                    
                    joursSemaine.forEach((jour, index) => {
                      const count = rdvSafe.filter((rdvItem: any) => {
                        if (!rdvItem.date_rdv) return false;
                        const date = parseLocalDate(rdvItem.date_rdv);
                        return date && date.getDay() === (index === 0 ? 1 : index === 6 ? 0 : index + 1);
                      }).length;
                      joursData.push({ label: jour, value: count });
                    });
                    
                    return (
                      <BarChart
                        data={joursData}
                        height={220}
                        horizontal={false}
                      />
                    );
                  })()}
                </div>
              </div>

              {/* Graphique linéaire - Évolution des consultations */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Évolution des consultations (7 derniers jours)</h4>
                {(() => {
                  const rdvSafe = Array.isArray(rdv) ? rdv : [];
                  const joursData: { name: string; value: number }[] = [];
                  const today = new Date();
                  
                  for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    
                    const count = rdvSafe.filter((rdvItem: any) => {
                      if (!rdvItem.date_rdv) return false;
                      const rdvDate = parseLocalDate(rdvItem.date_rdv);
                      return rdvDate && rdvDate.toDateString() === date.toDateString();
                    }).length;
                    
                    joursData.push({ name: dateStr, value: count });
                  }
                  
                  return (
                    <LineChart
                      data={joursData}
                      height={250}
                      title=""
                    />
                  );
                })()}
              </div>

              {/* Statistiques supplémentaires */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats?.rdvAujourdhui || 0}</div>
                  <div className="text-sm text-gray-600">RDV aujourd'hui</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats?.patientsArrives || 0}</div>
                  <div className="text-sm text-gray-600">Patients arrivés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats?.consultationsEnCours || 0}</div>
                  <div className="text-sm text-gray-600">Consultations en cours</div>
                </div>
              </div>
            </motion.div>

            {/* Cartes de génération de rapports */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Rapport RDV</h3>
                </div>
                <p className="text-gray-600 mb-4">Générer un rapport des rendez-vous</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Générer Rapport
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Rapport Performance</h3>
                </div>
                <p className="text-gray-600 mb-4">Analyse des performances du centre</p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Générer Rapport
                </button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Rapport Patients</h3>
                </div>
                <p className="text-gray-600 mb-4">Statistiques des patients</p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Générer Rapport
                </button>
              </motion.div>
            </div>
          </div>
        )}

        {/* Modal Nouveau Patient */}
        {showNewPatientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau patient</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNewPatientModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setShowNewPatientModal(false)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Assigner Patient */}
        {showAssignPatientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigner un patient</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Médecin</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    <option value="">Sélectionner un médecin</option>
                    {/* Afficher tous les médecins actifs, pas seulement ceux disponibles maintenant */}
                    {(Array.isArray(stats?.medecinsDisponibles) ? stats.medecinsDisponibles : [])
                      .map((medecin: any) => (
                        <option key={medecin.id} value={medecin.id}>
                          Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Heure d'assignation</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignPatientModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setShowAssignPatientModal(false)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Assigner
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

        {/* Modal Walk-In */}
      <WalkInModal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        onSuccess={() => {
          fetchRdvAujourdhui();
          fetchPersonnelStats();
          fetchRendezVousForCalendar();
          // Rafraîchir la file d'attente si l'onglet est actif
          if (activeTab === 'file-attente') {
            // Le FileAttenteTab se rafraîchit automatiquement toutes les 10s
            // mais on peut forcer un rafraîchissement immédiat si nécessaire
            window.dispatchEvent(new Event('refresh-file-attente'));
          }
        }}
      />

        {/* Modal Réajustement Planning */}
        {reajustementModal && rdvAReajuster && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Réajuster le Planning</h3>
                <button
                  onClick={() => {
                    setReajustementModal(false);
                    setRdvAReajuster(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="font-medium text-gray-900">
                    {rdvAReajuster.patient_prenom && rdvAReajuster.patient_nom
                      ? `${rdvAReajuster.patient_prenom} ${rdvAReajuster.patient_nom}`
                      : rdvAReajuster.patient || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Heure actuelle: {(() => {
                      if (rdvAReajuster.date_rdv) {
                        const date = parseLocalDate(rdvAReajuster.date_rdv);
                        return date ? date.toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A';
                      }
                      return rdvAReajuster.heure_rdv || rdvAReajuster.heure || 'N/A';
                    })()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouvelle heure <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    defaultValue={formatDateTimeLocal(rdvAReajuster.date_rdv)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min={formatDateTimeLocal(new Date())}
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Les rendez-vous suivants seront automatiquement réajustés si nécessaire.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setReajustementModal(false);
                    setRdvAReajuster(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
                    if (input && input.value) {
                      // Utiliser id_rdv en priorité, puis id
                      const rdvId = rdvAReajuster.id_rdv || rdvAReajuster.id;
                      if (!rdvId) {
                        console.error('❌ ID du RDV non trouvé:', rdvAReajuster);
                        showToast('Erreur: ID du rendez-vous non trouvé', 'error');
                        return;
                      }
                      console.log('🔄 Réajustement RDV ID:', rdvId, 'Nouvelle heure:', input.value);
                      handleReajustementPlanning(rdvId, input.value);
                    } else {
                      showToast('Veuillez sélectionner une nouvelle heure', 'error');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Réajuster</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Check-in */}
        {showCheckInModal && rdvToCheckIn && (
          <CheckInModal
            isOpen={showCheckInModal}
            onClose={() => {
              setShowCheckInModal(false);
              setRdvToCheckIn(null);
            }}
            onConfirm={confirmCheckIn}
            patientInfo={{
              nom: rdvToCheckIn.patient_nom || rdvToCheckIn.patient?.split(' ').pop() || '',
              prenom: rdvToCheckIn.patient_prenom || rdvToCheckIn.patient?.split(' ')[0] || rdvToCheckIn.patient || '',
              heure: rdvToCheckIn.heure_rdv || rdvToCheckIn.heure || (() => {
                if (rdvToCheckIn.date_rdv) {
                  try {
                    const date = parseLocalDate(rdvToCheckIn.date_rdv);
                    return date ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
                  } catch {
                    return '';
                  }
                }
                return '';
              })(),
              motif: rdvToCheckIn.motif || '',
              medecin: (() => {
                if (rdvToCheckIn.medecin_prenom && rdvToCheckIn.medecin_nom) {
                  return `Dr. ${rdvToCheckIn.medecin_prenom} ${rdvToCheckIn.medecin_nom}`;
                }
                return rdvToCheckIn.medecin || 'Médecin';
              })()
            }}
          />
        )}
    </div>
  );
};

export default PersonnelDashboard;
