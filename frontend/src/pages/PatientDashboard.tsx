import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { apiFetch } from '../utils/apiFetch';
import { apiServices } from '../lib/api';
import { useLogout } from '../hooks/useLogout';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatDateFR, formatTimeFR, formatDateTimeFR, formatBirthDateWithAge, parseLocalDate } from '../utils/dateFormatter';
import type { Prescription } from '../types';
import {
  User,
  Calendar,
  FileText,
  Pill,
  Syringe,
  Heart,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Activity,
  Bell,
  Plus,
  Edit,
  Eye,
  Download,
  Search,
  Filter,
  Stethoscope,
  Settings,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Trash2,
  Droplet,
  Scale,
  Ruler,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface PatientInfo {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  telephone: string;
  email: string;
  adresse: string;
  centre: string;
  groupe_sanguin: string;
  allergies: string[];
  maladies_chroniques: string[];
  notifications: Array<{
    id: number;
    type: 'confirmation' | 'rappel' | 'annulation' | 'nouveau_rdv';
    message: string;
    date: string;
    lu: boolean;
  }>;
}

interface RendezVous {
  id: number;
  date_rdv: string;
  heure_rdv: string;
  medecin: string;
  specialite: string;
  motif: string;
  statut: 'confirme' | 'attente' | 'termine' | 'annule' | 'absent';
  medecin_id?: number;
  centre_id?: number;
  centre_nom?: string;
  duree_estimee?: number;
  note_patient?: string;
  note_medecin?: string;
  heure_arrivee?: string;
  heure_debut_consultation?: string;
  heure_fin_consultation?: string;
  orientation?: string;
  symptomes?: any;
}

interface FicheMedicale {
  id: number;
  date_consultation: string;
  medecin: string;
  diagnostic: string;
  traitement: string;
  observations: string;
}

interface FicheMedicaleBase {
  id_info?: number;
  patient_id: number;
  groupe_sanguin: string | null;
  poids: number | null;
  taille: number | null;
  tension: string | null;
  allergies: string | null;
  antecedents: string | null;
  maladies_chroniques: string | null;
  medicaments_actuels: string | null;
  contacts_urgence: string | null;
  infos_complementaires: any;
  date_maj: string;
  created_at: string;
}

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [rdv, setRdv] = useState<RendezVous[]>([]);
  const [fiches, setFiches] = useState<FicheMedicale[]>([]);
  const [ficheMedicaleBase, setFicheMedicaleBase] = useState<FicheMedicaleBase | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [rdvToModify, setRdvToModify] = useState<RendezVous | null>(null);
  const [modifyFormData, setModifyFormData] = useState({
    date_rdv: '',
    heure_rdv: '',
    medecin_id: '',
    motif: '',
    centre_id: ''
  });
  const [medecinsDisponibles, setMedecinsDisponibles] = useState<any[]>([]);
  const [loadingMedecins, setLoadingMedecins] = useState(false);
  const [modifyError, setModifyError] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRDV, setSelectedRDV] = useState<RendezVous | null>(null);

  useEffect(() => {
    fetchPatientData();
  }, []);

  useEffect(() => {
    if (activeTab === 'fiches') {
      fetchFicheMedicaleBase();
    }
    if (activeTab === 'prescriptions') {
      fetchPrescriptions();
    }
  }, [activeTab]);

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const response = await apiServices.prescriptions.getMyPrescriptions();
      if (response.success && Array.isArray(response.data)) {
        setPrescriptions(response.data);
      } else {
        setPrescriptions([]);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const fetchPatientData = async () => {
    try {
      // Récupérer les informations du patient connecté (via JWT)
      const patientResponse = await apiFetch('/patients/me');

      if (patientResponse.ok) {
        const patientData = await patientResponse.json();
        const patient = patientData.data || {};
        // S'assurer que notifications est toujours un tableau
        if (!Array.isArray(patient.notifications)) {
          patient.notifications = [];
        }
        // S'assurer que allergies et maladies_chroniques sont des tableaux
        if (!Array.isArray(patient.allergies)) {
          patient.allergies = [];
        }
        if (!Array.isArray(patient.maladies_chroniques)) {
          patient.maladies_chroniques = [];
        }
        setPatientInfo(patient);
      } else {
        setPatientInfo(null);
      }

      // Récupérer les rendez-vous du patient connecté
      const rdvResponse = await apiFetch('/rendez-vous');

      if (rdvResponse.ok) {
        const rdvData = await rdvResponse.json();
        setRdv(Array.isArray(rdvData.data) ? rdvData.data : []);
      } else {
        setRdv([]);
      }

      // Récupérer les fiches médicales (optionnel pour l'instant)
      // const fichesResponse = await apiFetch('/fiches-medicales');
      // if (fichesResponse.ok) {
      //   const fichesData = await fichesResponse.json();
      //   setFiches(fichesData.data || []);
      // }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleTakeRDV = () => {
    navigate('/patient/book-appointment');
  };

  const fetchFicheMedicaleBase = async () => {
    try {
      const response = await apiFetch('/fiches-medicales/me');

      if (response.ok) {
        const data = await response.json();
        setFicheMedicaleBase(data.data);
        console.log('✅ Fiche médicale de base chargée:', data.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement fiche médicale:', error);
    }
  };

  const handleCreateMedicalRecord = () => {
    window.location.href = '/patient/medical-record';
  };

  const handleEditMedicalRecord = () => {
    window.location.href = '/patient/medical-record';
  };

  const handleDeleteMedicalRecord = async () => {
    if (!ficheMedicaleBase?.id_info) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer votre fiche médicale de base ?')) {
      return;
    }

    try {
      const response = await apiFetch(`/fiches-medicales/${ficheMedicaleBase.id_info}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Fiche médicale supprimée avec succès');
        setFicheMedicaleBase(null);
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCancelRDV = async (rdvId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
    try {
      const response = await apiFetch(`/rendez-vous/${rdvId}/annuler`, {
        method: 'POST',
        body: JSON.stringify({ raison: 'Annulé par le patient' })
      });
      const data = await response.json();
      if (data.success) {
        alert('Rendez-vous annulé avec succès');
        fetchPatientData();
      }
    } catch (error: any) {
      alert('Erreur lors de l\'annulation: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleOpenModifyModal = (rdvItem: RendezVous) => {
    // Vérifier les restrictions
    const rdvDate = parseLocalDate(rdvItem.date_rdv);
    if (!rdvDate) {
      alert('Erreur: Date du rendez-vous invalide');
      return;
    }

    // Vérifier si le RDV est dans moins de 24h
    const now = new Date();
    const diffHours = (rdvDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      alert('Vous ne pouvez pas modifier un rendez-vous dans moins de 24 heures. Veuillez contacter le centre de santé.');
      return;
    }

    // Vérifier si le RDV est confirmé, en cours ou terminé
    if (rdvItem.statut === 'confirme' || rdvItem.statut === 'en_cours' || rdvItem.statut === 'termine') {
      alert('Vous ne pouvez pas modifier un rendez-vous déjà confirmé, en cours ou terminé. Veuillez contacter le centre de santé pour toute modification.');
      return;
    }

    // Vérifier que le RDV est en attente uniquement
    if (rdvItem.statut !== 'attente') {
      alert('Seuls les rendez-vous en attente peuvent être modifiés.');
      return;
    }

    // Extraire la date et l'heure du RDV
    // Utiliser formatLocalDate pour éviter les problèmes de timezone
    const year = rdvDate.getFullYear();
    const month = String(rdvDate.getMonth() + 1).padStart(2, '0');
    const day = String(rdvDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hours = String(rdvDate.getHours()).padStart(2, '0');
    const minutes = String(rdvDate.getMinutes()).padStart(2, '0');
    const heureStr = `${hours}:${minutes}`;

    setRdvToModify(rdvItem);
    setModifyFormData({
      date_rdv: dateStr,
      heure_rdv: heureStr,
      medecin_id: (rdvItem as any).medecin_id?.toString() || '',
      motif: rdvItem.motif || '',
      centre_id: (rdvItem as any).centre_id?.toString() || ''
    });
    setShowModifyModal(true);
    setModifyError('');

    // Charger les médecins disponibles si on a un centre_id
    if ((rdvItem as any).centre_id) {
      loadMedecinsForModify((rdvItem as any).centre_id, dateStr, heureStr);
    }
  };

  const loadMedecinsForModify = async (centreId: number, dateRdv?: string, heureRdv?: string) => {
    setLoadingMedecins(true);
    try {
      let url = `/medecins/centre/${centreId}?disponible=true`;
      if (dateRdv && heureRdv) {
        url += `&date_rdv=${encodeURIComponent(dateRdv)}&heure_rdv=${encodeURIComponent(heureRdv)}`;
      }
      // Exclure le RDV en cours de modification du calcul de disponibilité
      if (rdvToModify?.id) {
        url += `&exclude_rdv_id=${rdvToModify.id}`;
      }

      const response = await apiFetch(url);
      const data = await response.json();

      if (data.success) {
        const medecins = (data.data || []).filter((m: any) => m.statut === 'actif');
        setMedecinsDisponibles(medecins);
      }
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
    } finally {
      setLoadingMedecins(false);
    }
  };

  useEffect(() => {
    if (showModifyModal && modifyFormData.centre_id && modifyFormData.date_rdv && modifyFormData.heure_rdv && rdvToModify) {
      loadMedecinsForModify(
        Number(modifyFormData.centre_id),
        modifyFormData.date_rdv,
        modifyFormData.heure_rdv
      );
    }
  }, [modifyFormData.centre_id, modifyFormData.date_rdv, modifyFormData.heure_rdv, rdvToModify]);

  const handleModifyRDV = async () => {
    if (!rdvToModify) return;

    setModifyError('');

    // Validation
    if (!modifyFormData.date_rdv || !modifyFormData.heure_rdv) {
      setModifyError('Date et heure sont requises');
      return;
    }

    if (!modifyFormData.medecin_id) {
      setModifyError('Veuillez sélectionner un médecin');
      return;
    }

    try {
      // Préparer les données pour l'API
      const updateData: any = {
        date_rdv: `${modifyFormData.date_rdv} ${modifyFormData.heure_rdv}:00`,
        medecin_id: Number(modifyFormData.medecin_id)
      };

      // Toujours mettre à jour les symptômes avec le motif
      // Le backend stringifie déjà le JSON, donc on envoie un objet
      // Récupérer les symptômes existants si disponibles, sinon créer un nouveau
      const symptomesExistants = (rdvToModify as any).symptomes;
      let symptomesArray: any[] = [];
      let intensite = 'moderee';

      if (symptomesExistants) {
        try {
          const symptomesParsed = typeof symptomesExistants === 'string'
            ? JSON.parse(symptomesExistants)
            : symptomesExistants;
          symptomesArray = symptomesParsed.symptomes || [];
          intensite = symptomesParsed.intensite || 'moderee';
        } catch (e) {
          // Si erreur de parsing, utiliser des valeurs par défaut
        }
      }

      updateData.symptomes = {
        motif: modifyFormData.motif || 'Consultation',
        symptomes: symptomesArray,
        intensite: intensite
      };

      const response = await apiFetch(`/rendez-vous/${rdvToModify.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Rendez-vous modifié avec succès !');
        setShowModifyModal(false);
        setRdvToModify(null);
        fetchPatientData();
      } else {
        setModifyError(data.message || 'Erreur lors de la modification');
      }
    } catch (error: any) {
      console.error('Erreur modification RDV:', error);
      setModifyError(error.message || 'Erreur lors de la modification');
    }
  };

  const handleDownloadFiche = async (ficheId: number) => {
    try {
      // Générer et télécharger la fiche médicale en PDF
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/fiches-medicales/${ficheId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fiche-medicale-${ficheId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erreur lors du téléchargement');
      }
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleMarkNotificationRead = async (notificationId: number) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/statut`, { statut: 'lue' });
      if (response.success) {
        // Recharger les notifications
        window.location.reload();
      }
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'rdv', label: 'Mes rendez-vous', icon: Calendar },
    { id: 'fiches', label: 'Mes fiches médicales', icon: FileText },
    { id: 'prescriptions', label: 'Mes prescriptions', icon: Pill },
    { id: 'vaccinations', label: 'Mes vaccinations', icon: Syringe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profil', label: 'Mon profil', icon: Settings },
  ];

  // Variables de sécurité pour éviter les erreurs undefined
  const rdvSafe = Array.isArray(rdv) ? rdv : [];
  const fichesSafe = Array.isArray(fiches) ? fiches : [];
  const notificationsSafe = Array.isArray(patientInfo?.notifications) ? patientInfo.notifications : [];
  const allergiesSafe = Array.isArray(patientInfo?.allergies) ? patientInfo.allergies : [];
  const maladiesChroniquesSafe = Array.isArray(patientInfo?.maladies_chroniques) ? patientInfo.maladies_chroniques : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patientInfo?.prenom} {patientInfo?.nom}
                </h1>
                <p className="text-gray-600">Espace patient</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleTakeRDV}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Calendar className="w-4 h-4" />
                <span>Prendre RDV</span>
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
                    ? 'bg-orange-100 text-orange-700'
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
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-sm border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Prochain RDV</p>
                    <p className="text-lg font-bold text-gray-900">
                      {rdvSafe.filter(r => r.statut === 'confirme' || r.statut === 'attente')
                        .sort((a, b) => new Date(a.date_rdv).getTime() - new Date(b.date_rdv).getTime())
                        .find(r => new Date(r.date_rdv) > new Date())
                        ? formatDateFR(rdvSafe.filter(r => r.statut === 'confirme' || r.statut === 'attente')
                          .sort((a, b) => new Date(a.date_rdv).getTime() - new Date(b.date_rdv).getTime())
                          .find(r => new Date(r.date_rdv) > new Date())?.date_rdv)
                        : 'Aucun'}
                    </p>
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
                    <p className="text-sm font-medium text-gray-600">Total RDV</p>
                    <p className="text-3xl font-bold text-gray-900">{rdvSafe.length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
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
                    <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                    <p className="text-3xl font-bold text-gray-900">{prescriptions.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Pill className="w-6 h-6 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-600">Notifications</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {notificationsSafe.filter(n => !n.lu).length}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Bell className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Informations personnelles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Mes informations</h3>
                <button
                  onClick={() => setActiveTab('profil')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nom complet</p>
                      <p className="font-medium text-gray-900">{patientInfo?.prenom} {patientInfo?.nom}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date de naissance</p>
                      <p className="font-medium text-gray-900">{formatBirthDateWithAge(patientInfo?.date_naissance)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium text-gray-900">{patientInfo?.telephone}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{patientInfo?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Centre de santé</p>
                      <p className="font-medium text-gray-900">{patientInfo?.centre}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Heart className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Groupe sanguin</p>
                      <p className="font-medium text-gray-900">{patientInfo?.groupe_sanguin}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Graphiques statistiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique en donut - Répartition des statuts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des rendez-vous</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Confirmés', value: rdvSafe.filter(r => r.statut === 'confirme').length, color: '#10B981' },
                          { name: 'En attente', value: rdvSafe.filter(r => r.statut === 'attente').length, color: '#F59E0B' },
                          { name: 'Terminés', value: rdvSafe.filter(r => r.statut === 'termine').length, color: '#3B82F6' },
                          { name: 'Annulés', value: rdvSafe.filter(r => r.statut === 'annule' || r.statut === 'absent').length, color: '#EF4444' }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Confirmés', value: rdvSafe.filter(r => r.statut === 'confirme').length, color: '#10B981' },
                          { name: 'En attente', value: rdvSafe.filter(r => r.statut === 'attente').length, color: '#F59E0B' },
                          { name: 'Terminés', value: rdvSafe.filter(r => r.statut === 'termine').length, color: '#3B82F6' },
                          { name: 'Annulés', value: rdvSafe.filter(r => r.statut === 'annule' || r.statut === 'absent').length, color: '#EF4444' }
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Graphique en barres - Évolution par mois */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution mensuelle</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const now = new Date();
                        const monthsData = [];
                        for (let i = 5; i >= 0; i--) {
                          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' });
                          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                          const count = rdvSafe.filter(rdv => {
                            if (!rdv.date_rdv) return false;
                            const rdvDate = parseLocalDate(rdv.date_rdv);
                            return rdvDate && rdvDate >= monthStart && rdvDate <= monthEnd;
                          }).length;
                          monthsData.push({ name: monthLabel, value: count });
                        }
                        return monthsData;
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Rendez-vous récents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Rendez-vous récents</h3>
                <button
                  onClick={() => setActiveTab('rdv')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="space-y-3">
                {rdvSafe.slice(0, 3).map((rdvItem) => (
                  <div key={rdvItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${rdvItem.statut === 'confirme' ? 'bg-green-100 text-green-600' :
                        rdvItem.statut === 'attente' ? 'bg-yellow-100 text-yellow-600' :
                          rdvItem.statut === 'termine' ? 'bg-blue-100 text-blue-600' :
                            'bg-red-100 text-red-600'
                        }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{rdvItem.medecin || 'Médecin non spécifié'}</p>
                        <p className="text-sm text-gray-500">{rdvItem.specialite || 'Spécialité non spécifiée'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatDateFR(rdvItem.date_rdv)}</p>
                      <p className="text-sm text-gray-500">{formatTimeFR(rdvItem.heure_rdv || rdvItem.date_rdv)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rdvItem.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                      rdvItem.statut === 'attente' ? 'bg-yellow-100 text-yellow-800' :
                        rdvItem.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {rdvItem.statut === 'confirme' ? 'Confirmé' :
                        rdvItem.statut === 'attente' ? 'En attente' :
                          rdvItem.statut === 'termine' ? 'Terminé' : 'Annulé'}
                    </span>
                  </div>
                ))}
                {rdvSafe.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun rendez-vous récent
                  </div>
                )}
              </div>
            </motion.div>

            {/* Fiches médicales récentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dernières consultations</h3>
                <button
                  onClick={() => setActiveTab('fiches')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="space-y-3">
                {fichesSafe.slice(0, 3).map((fiche) => (
                  <div key={fiche.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{fiche.medecin}</p>
                          <p className="text-sm text-gray-500">{fiche.date_consultation}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pl-12">
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium text-gray-900">Diagnostic:</span> {fiche.diagnostic}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Traitement:</span> {fiche.traitement}
                      </p>
                    </div>
                  </div>
                ))}
                {fichesSafe.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune consultation récente
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'rdv' && (
          <div className="space-y-6">
            {/* En-tête avec actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Mes rendez-vous</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un RDV..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleTakeRDV}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Prendre RDV</span>
                  </button>
                </div>
              </div>

              {/* Statistiques des RDV */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600">Total RDV</p>
                      <p className="text-2xl font-bold text-orange-900">{rdvSafe.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Confirmés</p>
                      <p className="text-2xl font-bold text-green-900">
                        {rdvSafe.filter(r => r.statut === 'confirme').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600">En attente</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {rdvSafe.filter(r => r.statut === 'attente').length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600">Terminés</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {rdvSafe.filter(r => r.statut === 'termine').length}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des RDV */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h4 className="text-lg font-semibold text-gray-900">Liste des rendez-vous</h4>
                <p className="text-sm text-gray-600">Gérez vos rendez-vous médicaux</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {rdvSafe
                    .filter(rdvItem =>
                      (rdvItem.medecin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (rdvItem.specialite || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (rdvItem.motif || '').toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((rdvItem) => (
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
                            <h4 className="font-medium text-gray-900">{rdvItem.medecin || 'Médecin non spécifié'}</h4>
                            <p className="text-sm text-gray-600">{rdvItem.specialite || 'Spécialité non spécifiée'}</p>
                            <p className="text-sm text-gray-500">{rdvItem.motif || 'Motif non spécifié'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatDateFR(rdvItem.date_rdv)}</p>
                            <p className="text-sm text-gray-600">{formatTimeFR(rdvItem.heure_rdv || rdvItem.date_rdv)}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rdvItem.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                              rdvItem.statut === 'attente' ? 'bg-yellow-100 text-yellow-800' :
                                rdvItem.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                              }`}>
                              {rdvItem.statut === 'confirme' ? 'Confirmé' :
                                rdvItem.statut === 'attente' ? 'En attente' :
                                  rdvItem.statut === 'termine' ? 'Terminé' : 'Annulé'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRDV(rdvItem);
                                setShowDetailsModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {rdvItem.statut === 'attente' && (
                              <button
                                onClick={() => handleOpenModifyModal(rdvItem)}
                                className="text-green-600 hover:text-green-800"
                                title="Modifier le rendez-vous"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {rdvItem.statut === 'attente' && (
                              <button
                                onClick={() => handleCancelRDV(rdvItem.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Annuler le rendez-vous"
                              >
                                <XCircle className="w-4 h-4" />
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

        {activeTab === 'fiches' && (
          <div className="space-y-6">
            {/* Fiche médicale de base */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-purple-600" />
                  Ma fiche médicale de base
                </h3>
                {!ficheMedicaleBase && (
                  <button
                    onClick={handleCreateMedicalRecord}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer ma fiche
                  </button>
                )}
              </div>

              {ficheMedicaleBase ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Informations principales */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Droplet className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Groupe sanguin</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {ficheMedicaleBase.groupe_sanguin || 'Non renseigné'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Scale className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Poids</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {ficheMedicaleBase.poids ? `${ficheMedicaleBase.poids} kg` : 'Non renseigné'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Ruler className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Taille</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {ficheMedicaleBase.taille ? `${ficheMedicaleBase.taille} cm` : 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tension artérielle */}
                  {ficheMedicaleBase.tension && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-orange-600" />
                        Tension artérielle
                      </h4>
                      <p className="text-gray-700">{ficheMedicaleBase.tension}</p>
                    </div>
                  )}

                  {/* Allergies */}
                  {ficheMedicaleBase.allergies && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                        Allergies
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{ficheMedicaleBase.allergies}</p>
                    </div>
                  )}

                  {/* Antécédents */}
                  {ficheMedicaleBase.antecedents && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-blue-600" />
                        Antécédents médicaux
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{ficheMedicaleBase.antecedents}</p>
                    </div>
                  )}

                  {/* Maladies chroniques */}
                  {ficheMedicaleBase.maladies_chroniques && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Heart className="w-4 h-4 mr-2 text-yellow-600" />
                        Maladies chroniques
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{ficheMedicaleBase.maladies_chroniques}</p>
                    </div>
                  )}

                  {/* Médicaments actuels */}
                  {ficheMedicaleBase.medicaments_actuels && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Pill className="w-4 h-4 mr-2 text-green-600" />
                        Médicaments actuels
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{ficheMedicaleBase.medicaments_actuels}</p>
                    </div>
                  )}

                  {/* Contacts d'urgence */}
                  {ficheMedicaleBase.contacts_urgence && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-purple-600" />
                        Contacts d'urgence
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{ficheMedicaleBase.contacts_urgence}</p>
                    </div>
                  )}

                  {/* Date de dernière mise à jour */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Dernière mise à jour : {new Date(ficheMedicaleBase.date_maj).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleEditMedicalRecord}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </button>
                      <button
                        onClick={handleDeleteMedicalRecord}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Vous n'avez pas encore créé votre fiche médicale de base.
                  </p>
                  <button
                    onClick={handleCreateMedicalRecord}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Créer ma fiche médicale
                  </button>
                </div>
              )}
            </div>

            {/* Fiches de consultation (futures consultations médicales) */}
            {fichesSafe.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes consultations</h3>
                <div className="space-y-4">
                  {fichesSafe.map((fiche) => (
                    <div key={fiche.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{fiche.medecin}</h4>
                        <p className="text-sm text-gray-500">{fiche.date_consultation}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Diagnostic:</strong> {fiche.diagnostic}
                        </p>
                        <p className="text-sm">
                          <strong>Traitement:</strong> {fiche.traitement}
                        </p>
                        <p className="text-sm">
                          <strong>Observations:</strong> {fiche.observations}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Mes prescriptions</h3>
              <button
                onClick={() => navigate('/prescriptions')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                <Eye className="w-4 h-4" />
                Voir toutes
              </button>
            </div>

            {loadingPrescriptions ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Chargement des prescriptions...</p>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Aucune prescription disponible</p>
                <p className="text-sm text-gray-500 mt-1">Vos prescriptions apparaîtront ici une fois prescrites par un médecin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.slice(0, 5).map((prescription: any) => (
                  <motion.div
                    key={prescription.id_prescription}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-blue-200 bg-white group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Pill className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-lg">
                              {prescription.nom_commercial || prescription.denomination_commune || 'Médicament'}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${prescription.statut === 'active' ? 'bg-green-100 text-green-800' :
                              prescription.statut === 'terminee' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {prescription.statut === 'active' ? 'En cours' :
                                prescription.statut === 'terminee' ? 'Terminée' :
                                  prescription.statut === 'arretee' ? 'Arrêtée' : 'Suspendue'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Dosage</span>
                              <span className="font-medium text-gray-900">{prescription.dosage_prescrit}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Fréquence</span>
                              <span className="font-medium text-gray-900">{prescription.frequence}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Durée</span>
                              <span className="font-medium text-gray-900">{prescription.duree_traitement} jours</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Début</span>
                              <span className="font-medium text-gray-900">{formatDateFR(prescription.date_debut)}</span>
                            </div>
                          </div>
                        </div>

                        {prescription.instructions_specifiques && (
                          <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p>{prescription.instructions_specifiques}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {prescriptions.length > 5 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => navigate('/prescriptions')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                    >
                      Voir toutes les prescriptions ({prescriptions.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'vaccinations' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Mes vaccinations</h3>
              <button
                onClick={() => window.location.href = '/vaccinations'}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                <Eye className="w-4 h-4" />
                Voir tout
              </button>
            </div>

            <div className="text-center py-16 bg-gradient-to-b from-purple-50 to-white rounded-xl border border-purple-100">
              <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                <Syringe className="w-12 h-12 text-purple-600" />
              </div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">Carnet de vaccination numérique</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Consultez votre historique de vaccination et vos prochains rappels en un coup d'œil.
              </p>
              <button
                onClick={() => window.location.href = '/vaccinations'}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm hover:shadow transition-all font-medium inline-flex items-center"
              >
                <Syringe className="w-4 h-4 mr-2" />
                Accéder à mon carnet
              </button>
            </div>
          </div>
        )}

        {/* Onglet Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Mes Notifications</h3>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {notificationsSafe.filter(n => !n.lu).length || 0} non lues
                  </span>
                </div>
              </div>

              {notificationsSafe.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Aucune notification</p>
                  <p className="text-sm text-gray-500 mt-1">Vous serez notifié ici de vos prochains rendez-vous et mises à jour.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notificationsSafe.map((notification) => (
                    <motion.div
                      key={notification.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 border rounded-xl transition-all ${notification.lu
                        ? 'border-gray-200 bg-white hover:border-gray-300'
                        : 'border-blue-200 bg-blue-50 hover:border-blue-300 shadow-sm'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`p-2.5 rounded-xl ${notification.type === 'confirmation' ? 'bg-green-100' :
                            notification.type === 'rappel' ? 'bg-yellow-100' :
                              notification.type === 'annulation' ? 'bg-red-100' :
                                'bg-blue-100'
                            }`}>
                            <Bell className={`w-5 h-5 ${notification.type === 'confirmation' ? 'text-green-600' :
                              notification.type === 'rappel' ? 'text-yellow-600' :
                                notification.type === 'annulation' ? 'text-red-600' :
                                  'text-blue-600'
                              }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${notification.type === 'confirmation' ? 'bg-green-100 text-green-800' :
                                notification.type === 'rappel' ? 'bg-yellow-100 text-yellow-800' :
                                  notification.type === 'annulation' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                {notification.type === 'confirmation' ? 'Confirmation' :
                                  notification.type === 'rappel' ? 'Rappel' :
                                    notification.type === 'annulation' ? 'Annulation' : 'Nouveau RDV'}
                              </span>
                              <span className="text-xs text-gray-500">• {notification.date}</span>
                            </div>
                            <p className={`text-sm ${notification.lu ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center ml-4">
                          {!notification.lu && (
                            <button
                              onClick={() => handleMarkNotificationRead(notification.id)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Marquer comme lu"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Mon Profil */}
        {activeTab === 'profil' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mon Profil</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informations personnelles</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        defaultValue={patientInfo?.nom}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        defaultValue={patientInfo?.prenom}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        defaultValue={patientInfo?.telephone}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={patientInfo?.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Informations médicales</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                      <input
                        type="date"
                        defaultValue={patientInfo?.date_naissance}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Groupe sanguin</label>
                      <select
                        defaultValue={patientInfo?.groupe_sanguin}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                      <textarea
                        defaultValue={allergiesSafe.join(', ')}
                        placeholder="Séparer par des virgules"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Maladies chroniques</label>
                      <textarea
                        defaultValue={maladiesChroniquesSafe.join(', ')}
                        placeholder="Séparer par des virgules"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Sauvegarder les modifications
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de modification de RDV */}
      {showModifyModal && rdvToModify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Modifier le rendez-vous</h3>
              <button
                onClick={() => {
                  setShowModifyModal(false);
                  setRdvToModify(null);
                  setModifyError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {modifyError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {modifyError}
              </div>
            )}

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date du rendez-vous *
                </label>
                <input
                  type="date"
                  value={modifyFormData.date_rdv}
                  onChange={(e) => setModifyFormData({ ...modifyFormData, date_rdv: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Heure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure du rendez-vous *
                </label>
                <input
                  type="time"
                  value={modifyFormData.heure_rdv}
                  onChange={(e) => setModifyFormData({ ...modifyFormData, heure_rdv: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              {/* Médecin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Médecin *
                </label>
                {loadingMedecins ? (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    <span className="text-sm">Chargement des médecins disponibles...</span>
                  </div>
                ) : (
                  <select
                    value={modifyFormData.medecin_id}
                    onChange={(e) => setModifyFormData({ ...modifyFormData, medecin_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">Sélectionner un médecin</option>
                    {medecinsDisponibles.map((medecin) => (
                      <option key={medecin.id_medecin} value={medecin.id_medecin}>
                        Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                      </option>
                    ))}
                  </select>
                )}
                {medecinsDisponibles.length === 0 && !loadingMedecins && (
                  <p className="mt-1 text-sm text-yellow-600">
                    Aucun médecin disponible pour cette date et heure. Veuillez choisir une autre date/heure.
                  </p>
                )}
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif de consultation
                </label>
                <textarea
                  value={modifyFormData.motif}
                  onChange={(e) => setModifyFormData({ ...modifyFormData, motif: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Décrivez le motif de votre consultation..."
                />
              </div>

              {/* Informations */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Vous ne pouvez modifier un rendez-vous que s'il est dans plus de 24 heures.
                  Les rendez-vous déjà en cours ou terminés ne peuvent pas être modifiés.
                </p>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModifyModal(false);
                  setRdvToModify(null);
                  setModifyError('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleModifyRDV}
                disabled={loadingMedecins || medecinsDisponibles.length === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer les modifications
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de détails du RDV */}
      {showDetailsModal && selectedRDV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Détails du rendez-vous</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRDV(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* En-tête avec statut */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${selectedRDV.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                    selectedRDV.statut === 'attente' ? 'bg-yellow-100 text-yellow-800' :
                      selectedRDV.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {selectedRDV.statut === 'confirme' ? 'Confirmé' :
                      selectedRDV.statut === 'attente' ? 'En attente' :
                        selectedRDV.statut === 'termine' ? 'Terminé' :
                          selectedRDV.statut === 'annule' ? 'Annulé' : 'Absent'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">RDV #{selectedRDV.id}</p>
                </div>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date et heure */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Date et heure</h4>
                  </div>
                  <p className="text-gray-700">{formatDateFR(selectedRDV.date_rdv)}</p>
                  <p className="text-gray-600 text-sm">{formatTimeFR(selectedRDV.heure_rdv || selectedRDV.date_rdv)}</p>
                  {selectedRDV.duree_estimee && (
                    <p className="text-gray-500 text-xs mt-1">Durée estimée: {selectedRDV.duree_estimee} minutes</p>
                  )}
                </div>

                {/* Médecin */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Stethoscope className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Médecin</h4>
                  </div>
                  <p className="text-gray-700">{selectedRDV.medecin || 'Médecin non spécifié'}</p>
                  <p className="text-gray-600 text-sm">{selectedRDV.specialite || 'Spécialité non spécifiée'}</p>
                </div>

                {/* Centre de santé */}
                {selectedRDV.centre_nom && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Centre de santé</h4>
                    </div>
                    <p className="text-gray-700">{selectedRDV.centre_nom}</p>
                  </div>
                )}

                {/* Orientation */}
                {selectedRDV.orientation && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Orientation</h4>
                    </div>
                    <p className="text-gray-700 capitalize">{selectedRDV.orientation}</p>
                  </div>
                )}
              </div>

              {/* Motif de consultation */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-600" />
                  Motif de consultation
                </h4>
                <p className="text-gray-700">{selectedRDV.motif || 'Non spécifié'}</p>
              </div>

              {/* Informations de suivi */}
              {(selectedRDV.heure_arrivee || selectedRDV.heure_debut_consultation || selectedRDV.heure_fin_consultation) && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                    Suivi du rendez-vous
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedRDV.heure_arrivee && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Heure d'arrivée:</span>
                        <span className="font-medium text-gray-900">
                          {typeof selectedRDV.heure_arrivee === 'string' && selectedRDV.heure_arrivee.includes(':')
                            ? selectedRDV.heure_arrivee.substring(0, 5)
                            : formatTimeFR(selectedRDV.heure_arrivee)}
                        </span>
                      </div>
                    )}
                    {selectedRDV.heure_debut_consultation && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Début de consultation:</span>
                        <span className="font-medium text-gray-900">{formatTimeFR(selectedRDV.heure_debut_consultation)}</span>
                      </div>
                    )}
                    {selectedRDV.heure_fin_consultation && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Fin de consultation:</span>
                        <span className="font-medium text-gray-900">{formatTimeFR(selectedRDV.heure_fin_consultation)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(selectedRDV.note_patient || selectedRDV.note_medecin) && (
                <div className="space-y-3">
                  {selectedRDV.note_patient && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-blue-600" />
                        Vos notes
                      </h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedRDV.note_patient}</p>
                    </div>
                  )}
                  {selectedRDV.note_medecin && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <Stethoscope className="w-4 h-4 mr-2 text-green-600" />
                        Notes du médecin
                      </h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedRDV.note_medecin}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRDV(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Fermer
                </button>
                {selectedRDV.statut === 'attente' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleOpenModifyModal(selectedRDV);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleCancelRDV(selectedRDV.id);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Annuler</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
