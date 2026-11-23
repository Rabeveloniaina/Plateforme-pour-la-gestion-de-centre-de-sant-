import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useLogout';
import { api } from '../lib/api';
import { apiFetch } from '../utils/apiFetch';
import { parseLocalDate, formatDateTimeLocal } from '../utils/dateFormatter';
import CalendarComponent from '../components/Calendar';
import CheckInModal from '../components/CheckInModal';
import CheckInStatus from '../components/CheckInStatus';
import { useToast } from '../context/ToastContext';
import {
  Stethoscope,
  Users,
  Calendar as CalendarIcon,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  User,
  Heart,
  Thermometer,
  Play,
  Pause,
  AlertTriangle,
  XCircle,
  Edit,
  Eye,
  Bell,
  Settings,
  TrendingUp,
  UserCheck,
  UserX,
  RefreshCw,
  CalendarClock,
  Zap,
  FileText
} from 'lucide-react';

interface MedecinStats {
  medecin: {
    id: number;
    nom: string;
    prenom: string;
    specialite: string;
    centre: string;
    statut: 'disponible' | 'en_consultation' | 'pause' | 'indisponible';
    horaires: {
      debut: string;
      fin: string;
      jours: string[];
    };
  };
  patientsAujourdhui: number;
  consultationsTerminees: number;
  consultationsEnCours: number;
  rdvEnAttente: number;
  prochainPatient: {
    id: number;
    nom: string;
    prenom: string;
    heure: string;
    motif: string;
  } | null;
}

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  age: number;
  telephone: string;
  motif: string;
  heure: string;
  statut: 'en_attente' | 'en_cours' | 'termine';
}

const MedecinDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<MedecinStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patients');
  const [fileAttente, setFileAttente] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<'disponible' | 'en_consultation' | 'pause' | 'indisponible'>('disponible');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedRDVDetails, setSelectedRDVDetails] = useState<any | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loadingRDVDetails, setLoadingRDVDetails] = useState(false);
  const [horaires, setHoraires] = useState<any>(null);
  const [gestionDynamique, setGestionDynamique] = useState(true);
  const [loadingHoraires, setLoadingHoraires] = useState(false);
  const [reajustementModal, setReajustementModal] = useState(false);
  const [rdvAReajuster, setRdvAReajuster] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMedecinStats();
      fetchPatientsAujourdhui();
      fetchRendezVousForCalendar();
      fetchHoraires();
      fetchFileAttente();
    }
  }, [user]);

  // Écouter les événements de rafraîchissement automatique
  useEffect(() => {
    const handleRefreshFileAttente = () => {
      console.log('🔄 Événement refresh-file-attente reçu');
      fetchFileAttente();
    };

    const handleRefreshPatients = () => {
      console.log('🔄 Événement refresh-patients-aujourdhui reçu');
      fetchPatientsAujourdhui();
    };

    const handleRefreshStats = () => {
      console.log('🔄 Événement refresh-stats reçu');
      fetchMedecinStats();
    };

    // Écouter tous les événements de rafraîchissement
    window.addEventListener('refresh-file-attente', handleRefreshFileAttente);
    window.addEventListener('refresh-patients-aujourdhui', handleRefreshPatients);
    window.addEventListener('refresh-stats', handleRefreshStats);

    // Nettoyer les event listeners
    return () => {
      window.removeEventListener('refresh-file-attente', handleRefreshFileAttente);
      window.removeEventListener('refresh-patients-aujourdhui', handleRefreshPatients);
      window.removeEventListener('refresh-stats', handleRefreshStats);
    };
  }, []);

  // Auto-refresh de la file d'attente toutes les 30 secondes
  useEffect(() => {
    if (!autoRefreshEnabled || activeTab !== 'file-attente') return;

    console.log('🔄 Auto-refresh activé pour file d\'attente (30s)');

    const interval = setInterval(() => {
      console.log('🔄 Rafraîchissement automatique...');
      fetchFileAttente();
      fetchMedecinStats();
    }, 30000); // 30 secondes

    return () => {
      console.log('🛑 Auto-refresh arrêté');
      clearInterval(interval);
    };
  }, [autoRefreshEnabled, activeTab]);

  useEffect(() => {
    if (activeTab === 'horaires') {
      fetchHoraires();
    }
  }, [activeTab]);

  const fetchRendezVousForCalendar = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = user?.id; // C'est l'id_user, le backend va le convertir en id_medecin

      if (!userId) {
        console.warn('⚠️ Pas d\'ID utilisateur disponible pour charger les rendez-vous');
        return;
      }

      console.log('📅 Récupération RDV pour calendrier - user_id:', userId);

      // Récupérer tous les rendez-vous futurs du médecin connecté
      // Le backend va automatiquement convertir user_id → id_medecin pour le rôle 'medecin'
      const response = await apiFetch(`/rendez-vous?limit=100`);

      if (!response.ok) {
        console.error('❌ Erreur API rendez-vous:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        console.error('❌ Détails erreur:', errorData);
        return;
      }

      const data = await response.json();
      console.log('✅ Données RDV récupérées:', data);
      console.log('✅ Nombre de RDV:', data.data?.length || 0);

      // Transformer les RDV en événements calendrier
      // Filtrer seulement les rendez-vous futurs ou d'aujourd'hui
      const now = new Date();
      const events = (Array.isArray(data.data) ? data.data : [])
        .filter((rdv: any) => {
          // Exclure les rendez-vous annulés ou absents
          if (rdv.statut === 'annule' || rdv.statut === 'absent') return false;

          // Inclure tous les rendez-vous futurs ou d'aujourd'hui
          const rdvDate = parseLocalDate(rdv.date_rdv || rdv.date) || new Date();
          return rdvDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
        })
        .map((rdv: any) => {
          // Utiliser parseLocalDate pour parser la date en LOCAL (pas UTC)
          let dateRdv: Date;

          if (rdv.date_rdv) {
            // Parser date_rdv directement (format MySQL DATETIME ou ISO)
            dateRdv = parseLocalDate(rdv.date_rdv) || new Date();
          } else if (rdv.date && rdv.heure_rdv) {
            // Combiner date et heure si séparés
            const combinedDateTime = `${rdv.date}T${rdv.heure_rdv}`;
            dateRdv = parseLocalDate(combinedDateTime) || new Date();
          } else {
            dateRdv = new Date();
          }

          console.log('📅 Date parsée:', {
            original: rdv.date_rdv || `${rdv.date} ${rdv.heure_rdv}`,
            parsed: dateRdv.toISOString(),
            hours: dateRdv.getHours(),
            minutes: dateRdv.getMinutes()
          });

          const duree = rdv.duree_estimee || 30;

          // Récupérer le nom du patient depuis les données retournées par le backend
          // Le backend retourne patient_nom et patient_prenom directement
          const patientNom = rdv.patient_nom || rdv.nom || '';
          const patientPrenom = rdv.patient_prenom || rdv.prenom || '';
          const patientName = `${patientPrenom} ${patientNom}`.trim() || 'Patient';

          // Assurer que le statut est correct (pas 'termine' par défaut)
          let statut = rdv.statut || 'attente';
          // Si le statut est vide ou invalide, mettre 'attente'
          if (!statut || statut === 'null' || statut === 'undefined') {
            statut = 'attente';
          }

          return {
            id: rdv.id || rdv.id_rdv,
            id_rdv: rdv.id || rdv.id_rdv,
            patient_id: rdv.patient_id,
            title: patientName,
            start: dateRdv,
            end: new Date(dateRdv.getTime() + duree * 60000),
            patientName: patientName,
            statut: statut,
            type: 'consultation',
            motif: rdv.motif || '',
            // Conserver les données originales pour le modal
            rawData: rdv
          };
        });

      console.log('✅ Événements calendrier créés:', events.length);
      setCalendarEvents(events);
    } catch (error) {
      console.error('❌ Erreur chargement RDV pour calendrier:', error);
    }
  };

  const fetchMedecinStats = async () => {
    if (!user?.id) {
      console.error('❌ Pas d\'ID médecin disponible');
      setLoading(false);
      return;
    }

    try {
      const userId = user.id;

      console.log('🔍 Récupération stats médecin - user_id:', userId);

      // Utiliser la nouvelle route pour les statistiques personnelles (jour)
      const statsResponse = await apiFetch(`/medecin/workflow/statistiques-personnelles?periode=jour`);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Stats personnelles récupérées:', statsData);

        // Utiliser aussi l'ancienne route pour les infos du médecin
        const medecinResponse = await apiFetch(`/medecins/${userId}/statistiques`);
        if (medecinResponse.ok) {
          const medecinData = await medecinResponse.json();
          // Fusionner les données
          setStats({
            ...medecinData.data,
            stats_personnelles: statsData.data
          });
        } else {
          // Utiliser seulement les nouvelles stats si l'ancienne route échoue
          setStats({
            medecin: {
              nom: user.username || '',
              prenom: '',
              specialite: '',
              centre: '',
              statut: 'disponible'
            },
            patientsAujourdhui: statsData.data?.rendez_vous?.total || 0,
            consultationsTerminees: statsData.data?.consultations?.terminees || 0,
            consultationsEnCours: statsData.data?.rendez_vous?.en_cours || 0,
            rdvEnAttente: statsData.data?.rendez_vous?.en_attente || 0,
            stats_personnelles: statsData.data
          });
        }
      } else {
        // Fallback sur l'ancienne route
        const response = await apiFetch(`/medecins/${userId}/statistiques`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        } else {
          throw new Error(`Erreur ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientsAujourdhui = async () => {
    if (!user?.id) {
      console.error('❌ Pas d\'ID médecin disponible');
      return;
    }

    try {
      // Utiliser la nouvelle route du workflow pour un planning complet
      const today = new Date().toISOString().split('T')[0];
      const response = await apiFetch(`/medecin/workflow/planning-du-jour?date=${today}`);

      if (!response.ok) {
        console.error('❌ Erreur API planning:', response.status);
        // Fallback sur l'ancienne route si la nouvelle n'est pas disponible
        const fallbackResponse = await apiFetch(`/rendez-vous/medecin/${user.id}/aujourdhui`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setPatients(fallbackData.data || []);
          return;
        }
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Planning du jour récupéré:', data);

      // Transformer les données pour compatibilité avec l'existant
      const patientsData = (data.data?.rendez_vous || []).map((rdv: any) => {
        // Parser les symptômes qui peuvent être un JSON string ou un objet
        let symptomesData: any = null;
        let motifText = 'Consultation';
        let symptomesList: string[] = [];

        if (rdv.symptomes) {
          try {
            // Si c'est une chaîne JSON, la parser
            if (typeof rdv.symptomes === 'string') {
              symptomesData = JSON.parse(rdv.symptomes);
            } else {
              symptomesData = rdv.symptomes;
            }

            // Extraire le motif
            if (symptomesData.motif) {
              motifText = symptomesData.motif;
            } else if (typeof symptomesData === 'string') {
              motifText = symptomesData;
            }

            // Extraire les symptômes
            if (Array.isArray(symptomesData.symptomes)) {
              symptomesList = symptomesData.symptomes;
            } else if (Array.isArray(symptomesData)) {
              symptomesList = symptomesData;
            }
          } catch (e) {
            // Si le parsing échoue, utiliser la valeur telle quelle
            if (typeof rdv.symptomes === 'string') {
              motifText = rdv.symptomes;
            }
          }
        }

        // Utiliser patient_id en priorité, puis id_patient
        // IMPORTANT: Le backend retourne rv.patient_id et p.id_patient
        // Les deux devraient être identiques, mais on utilise patient_id en priorité
        const patientId = rdv.patient_id || rdv.id_patient || null;

        console.log('📋 Mapping patient data:', {
          rdv_patient_id: rdv.patient_id,
          rdv_id_patient: rdv.id_patient,
          id_rdv: rdv.id_rdv,
          all_keys: Object.keys(rdv),
          rdv_full: rdv
        });

        if (!patientId) {
          console.error('❌ ERREUR: patient_id non trouvé dans les données RDV!', rdv);
        }

        return {
          id: rdv.id_rdv || patientId, // ID pour l'affichage (peut être id_rdv)
          id_rdv: rdv.id_rdv, // ID du rendez-vous
          patient_id: patientId, // ID du patient (à utiliser pour consulter le dossier) - CRITIQUE!
          nom: rdv.patient_nom,
          prenom: rdv.patient_prenom,
          age: rdv.age,
          telephone: rdv.patient_telephone,
          motif: motifText,
          symptomes: symptomesList,
          symptomesData: symptomesData,
          intensite: symptomesData?.intensite || null,
          heure: rdv.heure_rdv || rdv.date_rdv,
          date_rdv: rdv.date_rdv,
          statut: rdv.statut === 'attente' ? 'en_attente' : rdv.statut,
          heure_arrivee: rdv.heure_arrivee // IMPORTANT: Pour afficher l'état d'arrivée
        };
      });

      setPatients(patientsData);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    }
  };

  // Tous les hooks doivent être appelés AVANT tout return conditionnel
  const handleLogout = useLogout();


  const tabs = [
    { id: 'patients', label: 'Patients du jour', icon: Users },
    { id: 'file-attente', label: 'File d\'Attente', icon: AlertCircle },
    { id: 'calendrier', label: 'Calendrier', icon: CalendarIcon },
    { id: 'consultations', label: 'Consultations', icon: Stethoscope },
    { id: 'horaires', label: 'Mes horaires', icon: Clock },
    { id: 'statut', label: 'Mon statut', icon: Activity },
  ];

  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierPatient, setDossierPatient] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rdvToConfirm, setRdvToConfirm] = useState<number | null>(null);
  const [dureeEstimee, setDureeEstimee] = useState<number>(15);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [patientToCheckIn, setPatientToCheckIn] = useState<any>(null);
  const { showToast } = useToast();

  const handleViewDossier = async (patientId: number) => {
    console.log('📋 handleViewDossier appelé avec patientId:', patientId);
    setLoadingDossier(true);
    setShowDossierModal(true);
    try {
      const response = await apiFetch(`/medecin/workflow/dossier-patient/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dossier patient récupéré:', data);
        setDossierPatient(data.data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        console.error('❌ Erreur API dossier patient:', errorData);
        alert(`Erreur lors du chargement du dossier patient: ${errorData.message || 'Patient non trouvé'}`);
        setShowDossierModal(false);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement dossier:', error);
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
      setShowDossierModal(false);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleStartConsultation = (patientId: number, rdvId?: number, motif?: string) => {
    // Rediriger vers la page de consultation avec patient pré-sélectionné
    let url = `/consultations/nouvelle?patient_id=${patientId}`;
    if (rdvId) {
      url += `&rdv_id=${rdvId}`;
    }
    if (motif) {
      url += `&motif=${encodeURIComponent(motif)}`;
    }
    navigate(url);
  };

  const handleRedirectToSpecialist = async (patientId: number, rdvId?: number) => {
    const specialite = prompt('Spécialité requise:');
    if (!specialite) return;

    const motif = prompt('Motif de l\'orientation (optionnel):') || '';

    try {
      const response = await apiFetch('/medecin/workflow/rediriger-specialiste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          rdv_id: rdvId,
          specialite,
          motif_orientation: motif
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Orientation effectuée. ${data.data.specialistes_disponibles?.length || 0} spécialiste(s) disponible(s).`);
        if (data.data.specialistes_disponibles?.length > 0) {
          console.log('Spécialistes disponibles:', data.data.specialistes_disponibles);
        }
        fetchPatientsAujourdhui();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        alert('Erreur: ' + (errorData.message || 'Erreur lors de l\'orientation'));
      }
    } catch (error: any) {
      console.error('Erreur redirection:', error);
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleStatusChange = (newStatus: 'disponible' | 'en_consultation' | 'pause' | 'indisponible') => {
    setNewStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      // API pour mettre à jour le statut opérationnel du médecin
      const response = await api.put(`/medecins/${user.id}/statut-operationnel`, { statut_operationnel: newStatus });
      if (response.success) {
        alert('Statut mis à jour avec succès');
        setShowStatusModal(false);
        // Recharger les données
        fetchMedecinStats();
        fetchPatientsAujourdhui();
      }
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleAcceptRDV = async (rdvId: number) => {
    // Ouvrir le modal pour demander la durée
    setRdvToConfirm(rdvId);
    setShowConfirmModal(true);
  };

  const confirmRDVWithDuration = async () => {
    if (!rdvToConfirm) return;

    try {
      const response = await api.post(`/rendez-vous/${rdvToConfirm}/confirmer`, {
        duree_estimee: dureeEstimee
      });
      if (response.success || response.data) {
        alert(`Rendez-vous confirmé avec une durée de ${dureeEstimee} minutes`);
        setShowConfirmModal(false);
        setRdvToConfirm(null);
        setDureeEstimee(15); // Reset à la valeur par défaut
        fetchPatientsAujourdhui();
      }
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleRejectRDV = async (rdvId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce rendez-vous ?')) return;
    try {
      const raison = prompt('Raison du refus (optionnel):') || '';
      const response = await api.post(`/rendez-vous/${rdvId}/annuler`, { raison });
      if (response.success) {
        alert('Rendez-vous refusé');
        fetchPatientsAujourdhui();
      }
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handlePatientEnter = (patientId: number) => {
    // Trouver le patient
    const patient = patients.find(p => p.id === patientId || p.patient_id === patientId);
    if (patient) {
      setPatientToCheckIn(patient);
      setShowCheckInModal(true);
    } else {
      showToast('Patient non trouvé', 'error');
    }
  };

  const confirmCheckIn = async () => {
    if (!patientToCheckIn) return;

    try {
      // Utiliser id_rdv ou id selon ce qui est disponible
      const rdvId = patientToCheckIn.id_rdv || patientToCheckIn.id;
      if (!rdvId) {
        throw new Error('ID du rendez-vous non trouvé');
      }

      const response = await api.post(`/rendez-vous/${rdvId}/checkin`);

      if (response.success || response.data) {
        const message = response.message || response.data?.message || 'Patient enregistré avec succès';

        // Afficher notification de réajustement si présent
        if (response.reajustement) {
          showToast(`${message} - ${response.reajustement.message || 'Planning réajusté'}`, 'success');
        } else {
          showToast(message, 'success');
        }

        // Recharger les données pour refléter les changements
        await Promise.all([
          fetchPatientsAujourdhui(),
          fetchRendezVousForCalendar(),
          fetchMedecinStats()
        ]);
      } else {
        throw new Error('Échec du check-in');
      }
    } catch (error: any) {
      console.error('❌ Erreur check-in:', error);
      showToast(error.message || 'Erreur lors du check-in', 'error');
      throw error; // Rethrow pour que le modal puisse afficher l'erreur
    }
  };

  const handlePatientWait = (patientId: number) => {
    // Action immédiate - juste informer
    alert('Patient en attente');
  };

  const fetchFileAttente = async () => {
    try {
      const response = await apiFetch('/personnel/file-attente');
      const data = await response.json();

      console.log('📋 File d\'attente récupérée:', data);
      console.log('📊 Nombre de patients:', data.data?.length || 0);

      if (data.data && data.data.length > 0) {
        console.log('🔍 Statuts des patients:', data.data.map((p: any) => ({
          nom: p.patient_nom,
          statut: p.statut,
          id: p.id_rdv
        })));
      }

      if (data.success) {
        // Ne montrer que les patients déjà arrivés (heure_arrivee non nulle et valide)
        const arrivedOnly = (data.data || []).filter((p: any) => {
          const ha = p.heure_arrivee;
          return !!ha && typeof ha === 'string' && ha.includes(':') && ha !== '00:00:00';
        });
        setFileAttente(arrivedOnly);
        setLastUpdate(new Date()); // Mettre à jour le timestamp
      }
    } catch (error: any) {
      console.error('Erreur récupération file d\'attente:', error);
      setFileAttente([]);
    }
  };

  const handleAppelerPatient = async (rdvId: number, patient?: any) => {
    try {
      const response = await apiFetch(`/personnel/file-attente/${rdvId}/appeler`, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        showToast('Consultation démarrée - Ouverture du formulaire', 'success');

        // Rafraîchir la file d'attente et les stats en arrière-plan
        Promise.all([
          fetchFileAttente(),
          fetchMedecinStats(),
          fetchPatientsAujourdhui()
        ]).catch(err => console.error('Erreur rafraîchissement:', err));

        // Ouvrir directement le formulaire de consultation
        const patientId = patient?.patient_id || patient?.id_patient || data.data?.patient_id || data.data?.id_patient;
        const motif = data.data?.motif || patient?.motif || '';

        if (patientId) {
          // Construire l'URL avec patient, rdv et motif
          let url = `/consultations/nouvelle?patient_id=${patientId}&rdv_id=${rdvId}`;
          if (motif) {
            url += `&motif=${encodeURIComponent(motif)}`;
          }

          // Rediriger vers consultation avec patient, rdv et motif pré-remplis
          // La consultation se terminera automatiquement à la sauvegarde
          navigate(url);
        } else {
          console.error('Patient ID non trouvé:', { patient, data });
          showToast('Erreur: ID patient non trouvé', 'error');
        }
      } else {
        throw new Error(data.message || 'Erreur');
      }
    } catch (error: any) {
      console.error('Erreur appel patient:', error);
      showToast(error.message || 'Erreur lors de l\'appel du patient', 'error');
    }
  };

  // Fonction pour continuer une consultation en cours (redirige vers le formulaire)
  const handleContinuerConsultation = (patientId: number, rdvId: number, motif?: string) => {
    // Construire l'URL avec patient, rdv et motif si disponible
    let url = `/consultations/nouvelle?patient_id=${patientId}&rdv_id=${rdvId}`;
    if (motif) {
      url += `&motif=${encodeURIComponent(motif)}`;
    }
    // Rediriger vers le formulaire de consultation avec le patient et RDV pré-remplis
    navigate(url);
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

        // Rafraîchir les données
        await Promise.all([
          fetchFileAttente(),
          fetchMedecinStats(),
          fetchPatientsAujourdhui()
        ]);
      } else {
        throw new Error(data.message || 'Erreur');
      }
    } catch (error: any) {
      console.error('Erreur marquer absent:', error);
      showToast(error.message || 'Erreur lors du marquage absent', 'error');
    }
  };

  const handleReajustementPlanning = async (rdvId: number, nouvelleHeure: string) => {
    try {
      const response = await apiFetch(`/rendez-vous/reprogrammation/${rdvId}/reprogrammer`, {
        method: 'POST',
        body: JSON.stringify({
          nouvelle_date: nouvelleHeure
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('Planning réajusté avec succès', 'success');
        setReajustementModal(false);
        setRdvAReajuster(null);
        await Promise.all([
          fetchPatientsAujourdhui(),
          fetchFileAttente(),
          fetchMedecinStats(),
          fetchRendezVousForCalendar()
        ]);
      } else {
        // Afficher le message d'erreur du backend (ex: chevauchement)
        const errorMsg = data.message || 'Erreur lors du réajustement';
        console.error('❌ Erreur réajustement:', errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('❌ Erreur réseau réajustement:', error);
      showToast(error.message || 'Erreur de connexion lors du réajustement', 'error');
    }
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return '';

    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);

    if (seconds < 60) return `Il y a ${seconds}s`;
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`;
    return `Il y a ${Math.floor(seconds / 3600)}h`;
  };

  const fetchHoraires = async () => {
    if (!user?.id) return;
    try {
      setLoadingHoraires(true);
      const response: any = await api.get(`/medecins/${user.id}/horaires`);
      if (response.success) {
        const horairesData = response.data || {};
        setHoraires(horairesData);
        // Récupérer l'état de la gestion dynamique si disponible
        if (response.gestion_dynamique !== undefined) {
          setGestionDynamique(response.gestion_dynamique);
        }
      }
    } catch (error: any) {
      console.error('Erreur récupération horaires:', error);
      // Initialiser avec des horaires par défaut si aucune erreur critique
      if (!error.message.includes('404')) {
        setHoraires({
          lundi: { actif: true, debut: '08:00', fin: '17:00' },
          mardi: { actif: true, debut: '08:00', fin: '17:00' },
          mercredi: { actif: true, debut: '08:00', fin: '17:00' },
          jeudi: { actif: true, debut: '08:00', fin: '17:00' },
          vendredi: { actif: true, debut: '08:00', fin: '17:00' },
          samedi: { actif: false, debut: '08:00', fin: '17:00' },
          dimanche: { actif: false, debut: '08:00', fin: '17:00' }
        });
      }
    } finally {
      setLoadingHoraires(false);
    }
  };

  const handleUpdateHoraires = async () => {
    if (!user?.id || !horaires) return;
    try {
      setLoadingHoraires(true);
      const response = await api.put(`/medecins/${user.id}/horaires`, horaires);
      if (response.success) {
        alert('Horaires mis à jour avec succès');
        fetchMedecinStats();
      }
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoadingHoraires(false);
    }
  };

  const handleToggleGestionDynamique = async () => {
    if (!user?.id) return;
    try {
      const newValue = !gestionDynamique;
      const response = await api.put(`/medecins/${user.id}/gestion-dynamique`, { active: newValue });
      if (response.success) {
        setGestionDynamique(newValue);
        alert(`Gestion dynamique ${newValue ? 'activée' : 'désactivée'} avec succès`);
      }
    } catch (error: any) {
      alert('Erreur lors de la mise à jour: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const updateHoraireJour = (jour: string, field: string, value: any) => {
    setHoraires((prev: any) => ({
      ...prev,
      [jour]: {
        ...(prev[jour] || { actif: false, debut: '08:00', fin: '17:00' }),
        [field]: value
      }
    }));
  };

  const handleEventClick = async (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    setLoadingRDVDetails(true);

    // Récupérer les détails complets du rendez-vous depuis le backend
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/rendez-vous/${event.id_rdv}`);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Détails RDV récupérés:', data);
        setSelectedRDVDetails(data.data || data);
      } else {
        console.error('❌ Erreur récupération détails RDV:', response.status);
        // Utiliser les données de l'événement si on ne peut pas récupérer les détails
        setSelectedRDVDetails(event);
      }
    } catch (error) {
      console.error('❌ Erreur récupération détails RDV:', error);
      // Utiliser les données de l'événement en cas d'erreur
      setSelectedRDVDetails(event);
    } finally {
      setLoadingRDVDetails(false);
    }
  };

  const handleConfirmRDV = async () => {
    if (!selectedEvent) return;
    // Ouvrir le modal pour demander la durée
    setRdvToConfirm(selectedEvent.id_rdv);
    setShowConfirmModal(true);
    // Ne pas fermer le modal de l'événement pour l'instant
  };

  const confirmRDVFromCalendar = async () => {
    if (!rdvToConfirm) return;

    try {
      const response = await api.post(`/rendez-vous/${rdvToConfirm}/confirmer`, {
        duree_estimee: dureeEstimee
      });
      if (response.success || response.data) {
        const message = response.message || response.data?.message || `Rendez-vous confirmé avec une durée de ${dureeEstimee} minutes`;
        alert(message);
        setShowConfirmModal(false);
        setShowEventModal(false);
        setRdvToConfirm(null);
        setSelectedEvent(null);
        setSelectedRDVDetails(null);
        setDureeEstimee(15); // Reset à la valeur par défaut
        // Recharger les données pour refléter les changements
        fetchRendezVousForCalendar();
        fetchPatientsAujourdhui();
      }
    } catch (error: any) {
      console.error('❌ Erreur confirmation RDV:', error);
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleStartConsultationFromCalendar = () => {
    if (!selectedEvent?.patient_id) return;
    setShowEventModal(false);
    navigate(`/fiches-medicales/nouvelle?patient_id=${selectedEvent.patient_id}`);
  };

  const handleCheckInFromCalendar = async () => {
    if (!selectedEvent?.id_rdv) return;
    try {
      const response = await api.post(`/rendez-vous/${selectedEvent.id_rdv}/checkin`);
      if (response.success || response.data) {
        const message = response.message || response.data?.message || 'Patient enregistré avec succès';
        alert(message);
        setShowEventModal(false);
        setSelectedEvent(null);
        setSelectedRDVDetails(null);
        // Recharger les données pour refléter les changements
        fetchRendezVousForCalendar();
        fetchPatientsAujourdhui();
      }
    } catch (error: any) {
      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
              <div className="p-2 bg-green-100 rounded-lg">
                <Stethoscope className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dr. {stats?.medecin.nom} {stats?.medecin.prenom}
                </h1>
                <p className="text-gray-600">{stats?.medecin.specialite} - {stats?.medecin.centre}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Statut du médecin */}
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stats?.medecin.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                  stats?.medecin.statut === 'en_consultation' ? 'bg-blue-100 text-blue-800' :
                    stats?.medecin.statut === 'pause' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {stats?.medecin.statut === 'disponible' ? 'Disponible' :
                    stats?.medecin.statut === 'en_consultation' ? 'En consultation' :
                      stats?.medecin.statut === 'pause' ? 'En pause' : 'Indisponible'}
                </span>
              </div>

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
                <p className="text-sm font-medium text-gray-600">Patients aujourd'hui</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.patientsAujourdhui || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Consultations terminées</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.consultationsTerminees || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.consultationsEnCours || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.rdvEnAttente || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
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
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
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
        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* Prochain patient */}
            {stats?.prochainPatient && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-sm border border-blue-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Prochain Patient</h3>
                      <p className="text-sm text-gray-600">
                        {stats.prochainPatient.prenom} {stats.prochainPatient.nom}
                      </p>
                      <p className="text-sm text-gray-500">{stats.prochainPatient.motif}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{stats.prochainPatient.heure}</p>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handlePatientEnter(stats.prochainPatient!.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Faire entrer
                      </button>
                      <button
                        onClick={() => handlePatientWait(stats.prochainPatient!.id)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                      >
                        Faire attendre
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Liste des patients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border"
            >
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Patients du jour</h3>
                <p className="text-sm text-gray-600">Liste des patients à consulter aujourd'hui</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {patients.map((patient) => (
                    <motion.div
                      key={patient.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {patient.prenom} {patient.nom}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {patient.age ? `${patient.age} ans` : ''} {patient.age && patient.telephone ? '•' : ''} {patient.telephone}
                          </p>
                          {patient.motif && (
                            <div className="mt-1">
                              <p className="text-sm font-medium text-gray-700">
                                {patient.motif}
                              </p>
                              {patient.symptomes && Array.isArray(patient.symptomes) && patient.symptomes.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {patient.symptomes.slice(0, 3).map((symp: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                                    >
                                      {symp}
                                    </span>
                                  ))}
                                  {patient.symptomes.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                      +{patient.symptomes.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                              {patient.intensite && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${patient.intensite === 'severe' ? 'bg-red-100 text-red-800' :
                                  patient.intensite === 'moderee' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                  {patient.intensite === 'severe' ? 'Sévère' :
                                    patient.intensite === 'moderee' ? 'Modérée' : 'Légère'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            {(() => {
                              // Formater l'heure correctement
                              if (patient.heure) {
                                // Si c'est déjà au format HH:MM:SS, prendre seulement HH:MM
                                if (typeof patient.heure === 'string' && patient.heure.includes(':')) {
                                  const timeParts = patient.heure.split(':');
                                  return `${timeParts[0]}:${timeParts[1]}`;
                                }
                                return patient.heure;
                              }
                              // Sinon, extraire de date_rdv si disponible
                              if (patient.date_rdv) {
                                const date = new Date(patient.date_rdv);
                                return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                              }
                              return 'N/A';
                            })()}
                          </p>

                          {/* Statut du RDV */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${patient.statut === 'attente' || patient.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                            patient.statut === 'confirme' ? 'bg-blue-100 text-blue-800' :
                              patient.statut === 'en_cours' ? 'bg-purple-100 text-purple-800' :
                                patient.statut === 'termine' ? 'bg-green-100 text-green-800' :
                                  patient.statut === 'annule' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {patient.statut === 'attente' || patient.statut === 'en_attente' ? 'En attente' :
                              patient.statut === 'confirme' ? 'Confirmé' :
                                patient.statut === 'en_cours' ? 'En consultation' :
                                  patient.statut === 'termine' ? 'Terminé' :
                                    patient.statut === 'annule' ? 'Annulé' :
                                      patient.statut || 'Inconnu'}
                          </span>

                          {/* Statut Check-in */}
                          <div>
                            <CheckInStatus
                              heureArrivee={patient.heure_arrivee}
                              statut={patient.statut}
                              heureRdv={patient.heure}
                              compact={true}
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {/* Bouton Dossier - Toujours visible */}
                          <button
                            onClick={() => {
                              const patientId = patient.patient_id || patient.id;
                              if (!patientId) {
                                showToast('Erreur: ID patient non disponible', 'error');
                                return;
                              }
                              handleViewDossier(patientId);
                            }}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center space-x-1"
                            title="Voir le dossier patient"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Dossier</span>
                          </button>

                          {/* Bouton Confirmer - visible si RDV en attente et patient pas encore confirmé */}
                          {(patient.statut === 'attente' || patient.statut === 'en_attente') && (
                            <button
                              onClick={async () => {
                                try {
                                  // Utiliser prompt pour la durée estimée (sera amélioré avec un modal plus tard)
                                  const saisie = window.prompt('Durée estimée de la consultation (minutes)', '15');
                                  if (saisie === null) return; // Utilisateur a cliqué sur Annuler

                                  const minutes = parseInt(saisie, 10);
                                  if (isNaN(minutes) || minutes < 5 || minutes > 240) {
                                    showToast('Durée invalide (entre 5 et 240 minutes)', 'error');
                                    return;
                                  }

                                  console.log('Confirmation RDV avec durée estimée:', minutes);
                                  const res = await apiFetch(`/rendez-vous/${patient.id_rdv}/confirmer`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ duree_estimee: minutes })
                                  });
                                  const d = await res.json();
                                  if (!res.ok || !d.success) throw new Error(d.message || 'Erreur confirmation');
                                  showToast(`Rendez-vous confirmé (${minutes} min)`, 'success');
                                  // Rafraîchir
                                  await Promise.all([fetchPatientsAujourdhui(), fetchFileAttente(), fetchMedecinStats()]);
                                } catch (e: any) {
                                  showToast(e.message || 'Erreur lors de la confirmation', 'error');
                                }
                              }}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-1"
                              title="Confirmer le rendez-vous et définir la durée estimée"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Confirmer</span>
                            </button>
                          )}

                          {/* Bouton Réajuster - visible sauf si terminé ou annulé */}
                          {patient.statut !== 'termine' && patient.statut !== 'annule' && (
                            <button
                              onClick={() => { setRdvAReajuster(patient); setReajustementModal(true); }}
                              className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm flex items-center space-x-1"
                              title="Réajuster l'horaire du rendez-vous"
                            >
                              <CalendarClock className="w-4 h-4" />
                              <span>Réajuster</span>
                            </button>
                          )}

                          {/* Bouton Consulter - Si patient arrivé ou en cours, mais pas terminé/annulé */}
                          {(patient.heure_arrivee || patient.statut === 'en_cours') &&
                            patient.statut !== 'termine' &&
                            patient.statut !== 'annule' && (
                              <button
                                onClick={() => handleStartConsultation(patient.patient_id || patient.id, patient.id_rdv || patient.id, patient.motif)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center space-x-1"
                              >
                                <Stethoscope className="w-4 h-4" />
                                <span>Consulter</span>
                              </button>
                            )}

                          {/* Message si pas encore arrivé */}
                          {!patient.heure_arrivee && patient.statut !== 'en_cours' && (
                            <span className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Pas encore arrivé</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'file-attente' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">File d'Attente</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Patients en attente de consultation</span>
                  {lastUpdate && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center space-x-1">
                        <RefreshCw className={`w-3 h-3 ${autoRefreshEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="text-gray-500">{getTimeSinceUpdate()}</span>
                      </span>
                    </>
                  )}
                  <button
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    className={`text-xs px-2 py-1 rounded ${autoRefreshEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    title={autoRefreshEnabled ? 'Désactiver auto-refresh' : 'Activer auto-refresh'}
                  >
                    {autoRefreshEnabled ? '✓ Auto-refresh' : 'Auto-refresh OFF'}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-600">{fileAttente.length}</p>
                <p className="text-sm text-gray-600">Patient(s)</p>
              </div>
            </div>

            {fileAttente.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun patient en attente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fileAttente.map((patient: any, index: number) => (
                  <div key={patient.id_rdv} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-600">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {patient.patient_prenom} {patient.patient_nom}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>{patient.patient_telephone}</span>
                              {patient.heure_arrivee && (
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  Arrivé à {typeof patient.heure_arrivee === 'string' && patient.heure_arrivee.includes(':')
                                    ? patient.heure_arrivee.substring(0, 5) // Prendre seulement HH:MM
                                    : 'N/A'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {patient.motif_consultation && (
                          <p className="text-sm text-gray-600 mt-2 ml-11">
                            <strong>Motif :</strong> {patient.motif_consultation}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Badge de priorité */}
                        {patient.priorite === 'urgente' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            URGENT
                          </span>
                        )}

                        {/* Badge de statut */}
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${patient.statut === 'confirme' ? 'bg-blue-100 text-blue-700' :
                          patient.statut === 'en_cours' ? 'bg-purple-100 text-purple-700' :
                            patient.statut === 'attente' || patient.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {patient.statut === 'confirme' ? 'Confirmé' :
                            patient.statut === 'en_cours' ? 'En consultation' :
                              patient.statut === 'attente' || patient.statut === 'en_attente' ? 'En attente' :
                                patient.statut || 'Statut inconnu'}
                        </span>

                        {/* Bouton Marquer absent - Visible si retard > 15 min */}
                        {patient.statut !== 'en_cours' && patient.temps_attente_minutes > 15 && (
                          <button
                            onClick={() => handleMarquerAbsent(patient.id_rdv, `${patient.patient_prenom} ${patient.patient_nom}`)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-700 flex items-center space-x-1 text-sm"
                            title="Marquer comme absent"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Absent</span>
                          </button>
                        )}

                        {patient.statut === 'en_cours' ? (
                          <button
                            onClick={() => handleContinuerConsultation(
                              patient.patient_id || patient.id_patient,
                              patient.id_rdv,
                              patient.motif
                            )}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                            title="Continuer la consultation - Le RDV se terminera automatiquement à la sauvegarde"
                          >
                            <Stethoscope className="w-4 h-4" />
                            <span>Continuer consultation</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAppelerPatient(patient.id_rdv, patient)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                            title="Appeler le patient et démarrer la consultation"
                          >
                            <Play className="w-4 h-4" />
                            <span>Appeler</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consultations' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Consultations</h3>
              <button
                onClick={() => navigate('/fiches-medicales/nouvelle')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Nouvelle consultation
              </button>
            </div>
            <div className="text-center py-8">
              <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Gérez vos consultations médicales</p>
              <button
                onClick={() => navigate('/fiches-medicales')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Voir toutes les consultations
              </button>
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
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-green-50">
              <h3 className="text-lg font-semibold text-gray-900">Calendrier des rendez-vous</h3>
              <p className="text-sm text-gray-600">Visualisez tous vos rendez-vous en calendrier interactif</p>
            </div>
            <div className="p-6" style={{ minHeight: '600px' }}>
              <CalendarComponent
                events={calendarEvents}
                onEventClick={handleEventClick}
                onDateClick={(date) => {
                  console.log('Date cliquée pour nouveau RDV:', date);
                  // TODO: Ouvrir modal création RDV à cette date
                }}
                view="week"
              />
            </div>
          </motion.div>
        )}

        {/* Onglet Mes Horaires */}
        {activeTab === 'horaires' && (
          <div className="space-y-6">
            {/* Gestion dynamique */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion dynamique du statut</h3>
                  <p className="text-sm text-gray-600">
                    Le statut sera automatiquement mis à jour selon vos horaires de travail
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gestionDynamique}
                    onChange={handleToggleGestionDynamique}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            </div>

            {/* Horaires par jour */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Mes Horaires de Travail</h3>

              {loadingHoraires ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">Chargement des horaires...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((jour) => {
                    const jourData = horaires?.[jour] || { actif: false, debut: '08:00', fin: '17:00' };
                    const jourLabel = jour.charAt(0).toUpperCase() + jour.slice(1);

                    return (
                      <div key={jour} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={jourData.actif || false}
                              onChange={(e) => updateHoraireJour(jour, 'actif', e.target.checked)}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="font-medium text-gray-900">{jourLabel}</span>
                          </label>
                        </div>

                        {jourData.actif && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Heure de début</label>
                              <input
                                type="time"
                                value={jourData.debut || '08:00'}
                                onChange={(e) => updateHoraireJour(jour, 'debut', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Heure de fin</label>
                              <input
                                type="time"
                                value={jourData.fin || '17:00'}
                                onChange={(e) => updateHoraireJour(jour, 'fin', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Pause (optionnel)</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="time"
                                  placeholder="Début"
                                  value={jourData.pause_debut || ''}
                                  onChange={(e) => updateHoraireJour(jour, 'pause_debut', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                                <input
                                  type="time"
                                  placeholder="Fin"
                                  value={jourData.pause_fin || ''}
                                  onChange={(e) => updateHoraireJour(jour, 'pause_fin', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={handleUpdateHoraires}
                      disabled={loadingHoraires}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loadingHoraires ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sauvegarde...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Sauvegarder les horaires</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Comment ça fonctionne ?</h4>
                  <p className="text-sm text-blue-800">
                    Si la gestion dynamique est activée, votre statut sera automatiquement mis à jour selon vos horaires :
                    <br />• <strong>Disponible</strong> : Pendant vos heures de travail
                    <br />• <strong>Pause</strong> : Pendant votre période de pause
                    <br />• <strong>Indisponible</strong> : En dehors de vos heures de travail
                    <br />• Si vous êtes <strong>en congé</strong>, le statut reste indisponible
                    <br />
                    <br />Le statut est vérifié et mis à jour automatiquement toutes les 5 minutes.
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton pour forcer la mise à jour */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Mise à jour manuelle</h4>
                  <p className="text-sm text-gray-600">
                    Forcez la mise à jour de votre statut maintenant (pour tests)
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!user?.id) return;
                    try {
                      const response: any = await api.post(`/medecins/${user.id}/statut/update-now`);
                      if (response.success) {
                        alert(response.message || 'Statut mis à jour');
                        fetchMedecinStats();
                      }
                    } catch (error: any) {
                      alert('Erreur: ' + (error.message || 'Erreur inconnue'));
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Mettre à jour maintenant</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Mon Statut */}
        {activeTab === 'statut' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion de mon statut</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleStatusChange('disponible')}
                  className={`p-6 rounded-xl border-2 transition-all ${stats?.medecin.statut === 'disponible'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                >
                  <div className="text-center">
                    <div className="p-3 bg-green-100 rounded-lg mx-auto mb-3 w-fit">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Disponible</h4>
                    <p className="text-sm text-gray-600">Prêt à recevoir des patients</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleStatusChange('en_consultation')}
                  className={`p-6 rounded-xl border-2 transition-all ${stats?.medecin.statut === 'en_consultation'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                >
                  <div className="text-center">
                    <div className="p-3 bg-blue-100 rounded-lg mx-auto mb-3 w-fit">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">En consultation</h4>
                    <p className="text-sm text-gray-600">Actuellement avec un patient</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleStatusChange('pause')}
                  className={`p-6 rounded-xl border-2 transition-all ${stats?.medecin.statut === 'pause'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                >
                  <div className="text-center">
                    <div className="p-3 bg-yellow-100 rounded-lg mx-auto mb-3 w-fit">
                      <Pause className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">En pause</h4>
                    <p className="text-sm text-gray-600">Temporairement indisponible</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleStatusChange('indisponible')}
                  className={`p-6 rounded-xl border-2 transition-all ${stats?.medecin.statut === 'indisponible'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                >
                  <div className="text-center">
                    <div className="p-3 bg-red-100 rounded-lg mx-auto mb-3 w-fit">
                      <UserX className="w-6 h-6 text-red-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Indisponible</h4>
                    <p className="text-sm text-gray-600">Non disponible pour consultations</p>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Statut actuel */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h4 className="font-medium text-gray-900 mb-4">Statut actuel</h4>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stats?.medecin.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                  stats?.medecin.statut === 'en_consultation' ? 'bg-blue-100 text-blue-800' :
                    stats?.medecin.statut === 'pause' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {stats?.medecin.statut === 'disponible' ? 'Disponible' :
                    stats?.medecin.statut === 'en_consultation' ? 'En consultation' :
                      stats?.medecin.statut === 'pause' ? 'En pause' : 'Indisponible'}
                </span>
                <span className="text-sm text-gray-500">
                  Dernière mise à jour: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Réajustement Planning (réutilisé comme dans PersonnelDashboard) */}
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
                    {(() => {
                      const nom = rdvAReajuster.patient_nom || rdvAReajuster.nom || '';
                      const prenom = rdvAReajuster.patient_prenom || rdvAReajuster.prenom || '';
                      const full = `${prenom} ${nom}`.trim();
                      return full || 'N/A';
                    })()}
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
                      return rdvAReajuster.heure || 'N/A';
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
                      const rdvId = rdvAReajuster.id_rdv || rdvAReajuster.id;
                      if (!rdvId) {
                        showToast('Erreur: ID du rendez-vous non trouvé', 'error');
                        return;
                      }
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
        {/* Modal de confirmation de changement de statut */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer le changement de statut</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir changer votre statut vers "{newStatus}" ?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmStatusChange}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour les actions sur les rendez-vous du calendrier */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 pb-0">
                <h3 className="text-lg font-semibold text-gray-900">Détails du rendez-vous</h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                    setSelectedRDVDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {loadingRDVDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <span className="text-gray-600">Chargement des détails...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header avec gradient et statut */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <User className="w-6 h-6" />
                          <h3 className="text-2xl font-bold">
                            {selectedRDVDetails?.patient_nom && selectedRDVDetails?.patient_prenom
                              ? `${selectedRDVDetails.patient_prenom} ${selectedRDVDetails.patient_nom}`
                              : selectedEvent.patientName}
                          </h3>
                        </div>
                        {selectedRDVDetails?.patient_telephone && (
                          <p className="text-blue-100 ml-9">📞 {selectedRDVDetails.patient_telephone}</p>
                        )}
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${(selectedRDVDetails?.statut || selectedEvent.statut) === 'confirme' ? 'bg-green-500 text-white' :
                        (selectedRDVDetails?.statut || selectedEvent.statut) === 'attente' ? 'bg-yellow-500 text-white' :
                          (selectedRDVDetails?.statut || selectedEvent.statut) === 'termine' ? 'bg-blue-500 text-white' :
                            (selectedRDVDetails?.statut || selectedEvent.statut) === 'en_cours' ? 'bg-purple-500 text-white' :
                              (selectedRDVDetails?.statut || selectedEvent.statut) === 'annule' ? 'bg-red-500 text-white' :
                                'bg-gray-500 text-white'
                        }`}>
                        {(selectedRDVDetails?.statut || selectedEvent.statut) === 'confirme' ? '✓ Confirmé' :
                          (selectedRDVDetails?.statut || selectedEvent.statut) === 'attente' ? '⏳ En attente' :
                            (selectedRDVDetails?.statut || selectedEvent.statut) === 'termine' ? '✅ Terminé' :
                              (selectedRDVDetails?.statut || selectedEvent.statut) === 'en_cours' ? '🔄 En cours' :
                                (selectedRDVDetails?.statut || selectedEvent.statut) === 'annule' ? '❌ Annulé' :
                                  (selectedRDVDetails?.statut || selectedEvent.statut) || 'Inconnu'}
                      </span>
                    </div>
                  </div>

                  {/* Contenu en 2 colonnes */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Colonne gauche */}
                      <div className="space-y-4">
                        {/* Date et heure - Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 rounded-lg p-2">
                              <CalendarClock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Date et heure</p>
                              <p className="font-semibold text-gray-900 text-sm">
                                {(() => {
                                  const rdvData = selectedRDVDetails || selectedEvent;
                                  let dateToDisplay: Date;

                                  if (rdvData.date_rdv) {
                                    dateToDisplay = parseLocalDate(rdvData.date_rdv) || new Date();
                                  } else if (rdvData.date && rdvData.heure_rdv) {
                                    const combinedDateTime = `${rdvData.date}T${rdvData.heure_rdv}`;
                                    dateToDisplay = parseLocalDate(combinedDateTime) || new Date();
                                  } else {
                                    dateToDisplay = selectedEvent.start;
                                  }

                                  return dateToDisplay.toLocaleString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Motif - Card */}
                        {(selectedRDVDetails?.motif || selectedEvent.motif) && (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                            <div className="flex items-start space-x-3">
                              <div className="bg-purple-600 rounded-lg p-2">
                                <Stethoscope className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 mb-1">Motif de consultation</p>
                                <p className="font-medium text-gray-900 text-sm">{selectedRDVDetails?.motif || selectedEvent.motif}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Informations complémentaires - Grid */}
                        {(selectedRDVDetails?.duree_estimee || selectedRDVDetails?.orientation) && (
                          <div className="grid grid-cols-2 gap-3">
                            {selectedRDVDetails?.duree_estimee && (
                              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Clock className="w-4 h-4 text-green-600" />
                                  <p className="text-xs text-gray-600">Durée</p>
                                </div>
                                <p className="font-semibold text-green-900">{selectedRDVDetails.duree_estimee} min</p>
                              </div>
                            )}
                            {selectedRDVDetails?.orientation && (
                              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                                  <p className="text-xs text-gray-600">Orientation</p>
                                </div>
                                <p className="font-semibold text-indigo-900 text-sm capitalize">
                                  {selectedRDVDetails.orientation === 'generaliste' ? 'Généraliste' :
                                    selectedRDVDetails.orientation === 'specialiste' ? 'Spécialiste' :
                                      selectedRDVDetails.orientation}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Colonne droite */}
                      <div className="space-y-4">
                        {/* Symptômes détaillés - Card */}
                        {selectedRDVDetails?.symptomes && (
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
                            <div className="flex items-start space-x-3">
                              <div className="bg-yellow-600 rounded-lg p-2 flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600 mb-2">Symptômes rapportés</p>
                                {(() => {
                                  try {
                                    const symptomes = typeof selectedRDVDetails.symptomes === 'string'
                                      ? JSON.parse(selectedRDVDetails.symptomes)
                                      : selectedRDVDetails.symptomes;

                                    return (
                                      <div className="space-y-2">
                                        {Array.isArray(symptomes.symptomes) && symptomes.symptomes.length > 0 && (
                                          <ul className="space-y-1">
                                            {symptomes.symptomes.slice(0, 3).map((s: string, idx: number) => (
                                              <li key={idx} className="flex items-start text-xs text-gray-700">
                                                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                                                <span className="break-words">{s}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                          {symptomes.intensite && (
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${symptomes.intensite === 'severe' ? 'bg-red-100 text-red-800' :
                                              symptomes.intensite === 'moderee' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                              }`}>
                                              {symptomes.intensite === 'severe' ? '🔴 Sévère' :
                                                symptomes.intensite === 'moderee' ? '🟡 Modérée' : '🟢 Légère'}
                                            </span>
                                          )}
                                          {symptomes.duree_symptomes && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                              ⏱️ {symptomes.duree_symptomes}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  } catch (e) {
                                    return <p className="text-xs text-gray-700">{String(selectedRDVDetails.symptomes)}</p>;
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes du patient - Card */}
                        {selectedRDVDetails?.note_patient && (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-start space-x-3">
                              <div className="bg-gray-600 rounded-lg p-2 flex-shrink-0">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600 mb-2">Notes du patient</p>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-2 break-words">{selectedRDVDetails.note_patient}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Full width en bas */}
                    <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t">
                      {(selectedRDVDetails?.statut || selectedEvent.statut) === 'attente' && (
                        <button
                          onClick={handleConfirmRDV}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 font-medium transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Confirmer le rendez-vous</span>
                        </button>
                      )}
                      {(selectedRDVDetails?.statut || selectedEvent.statut) !== 'termine' &&
                        (selectedRDVDetails?.statut || selectedEvent.statut) !== 'annule' && (
                          <button
                            onClick={handleCheckInFromCalendar}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 font-medium transition-colors"
                          >
                            <UserCheck className="w-5 h-5" />
                            <span>
                              {(selectedRDVDetails?.statut || selectedEvent.statut) === 'attente'
                                ? 'Faire entrer (Check-in et confirmer)'
                                : 'Faire entrer (Check-in)'}
                            </span>
                          </button>
                        )}
                      {(selectedRDVDetails?.statut || selectedEvent.statut) !== 'termine' &&
                        (selectedRDVDetails?.statut || selectedEvent.statut) !== 'annule' && (
                          <button
                            onClick={handleStartConsultationFromCalendar}
                            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 font-medium transition-colors"
                          >
                            <Stethoscope className="w-5 h-5" />
                            <span>Consulter</span>
                          </button>
                        )}

                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal Dossier Patient */}
        {showDossierModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Dossier Patient</h2>
                  <button
                    onClick={() => {
                      setShowDossierModal(false);
                      setDossierPatient(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {loadingDossier ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement du dossier...</p>
                  </div>
                ) : dossierPatient ? (
                  <div className="space-y-6">
                    {/* Informations patient */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Informations Patient</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Nom:</span>
                          <span className="ml-2 font-medium">{dossierPatient.patient?.nom} {dossierPatient.patient?.prenom}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Téléphone:</span>
                          <span className="ml-2 font-medium">{dossierPatient.patient?.telephone}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <span className="ml-2 font-medium">{dossierPatient.patient?.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date de naissance:</span>
                          <span className="ml-2 font-medium">{dossierPatient.patient?.date_naissance || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Infos médicales */}
                    {dossierPatient.infos_medicales && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Informations Médicales</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {dossierPatient.infos_medicales.groupe_sanguin && (
                            <div>
                              <span className="text-gray-600">Groupe sanguin:</span>
                              <span className="ml-2 font-medium">{dossierPatient.infos_medicales.groupe_sanguin}</span>
                            </div>
                          )}
                          {dossierPatient.infos_medicales.poids && (
                            <div>
                              <span className="text-gray-600">Poids:</span>
                              <span className="ml-2 font-medium">{dossierPatient.infos_medicales.poids} kg</span>
                            </div>
                          )}
                          {dossierPatient.infos_medicales.taille && (
                            <div>
                              <span className="text-gray-600">Taille:</span>
                              <span className="ml-2 font-medium">{dossierPatient.infos_medicales.taille} cm</span>
                            </div>
                          )}
                          {dossierPatient.infos_medicales.tension && (
                            <div>
                              <span className="text-gray-600">Tension:</span>
                              <span className="ml-2 font-medium">{dossierPatient.infos_medicales.tension}</span>
                            </div>
                          )}
                          {dossierPatient.infos_medicales.allergies && (
                            <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded">
                              <span className="text-red-700 font-semibold">⚠️ Allergies:</span>
                              <p className="mt-1 text-red-600 font-medium">{dossierPatient.infos_medicales.allergies}</p>
                            </div>
                          )}
                          {dossierPatient.infos_medicales.antecedents && (
                            <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded">
                              <span className="text-blue-700 font-semibold">📋 Antécédents médicaux:</span>
                              <p className="mt-1 text-gray-700 whitespace-pre-wrap">{dossierPatient.infos_medicales.antecedents}</p>
                            </div>
                          )}
                          {dossierPatient.infos_medicales.maladies_chroniques && (
                            <div className="col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <span className="text-yellow-700 font-semibold">🏥 Maladies chroniques:</span>
                              <p className="mt-1 text-gray-700 whitespace-pre-wrap">{dossierPatient.infos_medicales.maladies_chroniques}</p>
                            </div>
                          )}
                          {dossierPatient.infos_medicales.medicaments_actuels && (
                            <div className="col-span-2 p-3 bg-purple-50 border border-purple-200 rounded">
                              <span className="text-purple-700 font-semibold">💊 Médicaments actuels:</span>
                              <p className="mt-1 text-gray-700 whitespace-pre-wrap">{dossierPatient.infos_medicales.medicaments_actuels}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Historique RDV */}
                    {dossierPatient.historique_rdv && dossierPatient.historique_rdv.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Historique des Rendez-vous</h3>
                        <div className="space-y-2">
                          {dossierPatient.historique_rdv.slice(0, 5).map((rdv: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">{parseLocalDate(rdv.date_rdv)?.toLocaleDateString('fr-FR') || 'N/A'}</span>
                                <span className={`px-2 py-1 rounded text-xs ${rdv.statut === 'termine' ? 'bg-green-100 text-green-800' :
                                  rdv.statut === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {rdv.statut}
                                </span>
                              </div>
                              {rdv.note_medecin && (
                                <p className="text-gray-600 mt-1">{rdv.note_medecin}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fiches médicales */}
                    {dossierPatient.fiches_medicales && dossierPatient.fiches_medicales.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Fiches Médicales</h3>
                        <div className="space-y-2">
                          {dossierPatient.fiches_medicales.slice(0, 3).map((fiche: any, idx: number) => (
                            <div key={idx} className="bg-purple-50 rounded p-3 text-sm">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">{new Date(fiche.date_consultation).toLocaleDateString('fr-FR')}</span>
                                <span className="text-xs text-gray-600">{fiche.diagnostic_principal || 'Sans diagnostic'}</span>
                              </div>
                              {fiche.motif_consultation && (
                                <p className="text-gray-600">{fiche.motif_consultation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prescriptions actives */}
                    {dossierPatient.prescriptions_actives && dossierPatient.prescriptions_actives.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Prescriptions Actives</h3>
                        <div className="space-y-2">
                          {dossierPatient.prescriptions_actives.map((prescription: any, idx: number) => (
                            <div key={idx} className="bg-orange-50 rounded p-3 text-sm">
                              <div className="font-medium">{prescription.medicament_nom || 'Médicament'}</div>
                              <div className="text-gray-600 mt-1">
                                {prescription.dosage_prescrit} - {prescription.frequence}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          if (dossierPatient.patient?.id_patient) {
                            handleStartConsultation(dossierPatient.patient.id_patient);
                          }
                          setShowDossierModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Nouvelle consultation
                      </button>
                      <button
                        onClick={() => {
                          if (dossierPatient.patient?.id_patient) {
                            handleRedirectToSpecialist(dossierPatient.patient.id_patient);
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Rediriger vers spécialiste
                      </button>
                      <button
                        onClick={() => {
                          setShowDossierModal(false);
                          setDossierPatient(null);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de confirmation avec durée */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer le rendez-vous</h3>
              <p className="text-sm text-gray-600 mb-4">
                Veuillez spécifier la durée estimée de la consultation (en minutes).
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée estimée (minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={dureeEstimee}
                  onChange={(e) => setDureeEstimee(parseInt(e.target.value) || 15)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="15"
                />
                <p className="text-xs text-gray-500 mt-1">Durée recommandée : 15-30 minutes pour une consultation standard</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setRdvToConfirm(null);
                    setDureeEstimee(30);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={rdvToConfirm === selectedEvent?.id_rdv ? confirmRDVFromCalendar : confirmRDVWithDuration}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Check-in */}
        {showCheckInModal && patientToCheckIn && (
          <CheckInModal
            isOpen={showCheckInModal}
            onClose={() => {
              setShowCheckInModal(false);
              setPatientToCheckIn(null);
            }}
            onConfirm={confirmCheckIn}
            patientInfo={{
              nom: patientToCheckIn.nom,
              prenom: patientToCheckIn.prenom,
              heure: (() => {
                if (patientToCheckIn.heure) {
                  if (typeof patientToCheckIn.heure === 'string' && patientToCheckIn.heure.includes(':')) {
                    const timeParts = patientToCheckIn.heure.split(':');
                    return `${timeParts[0]}:${timeParts[1]}`;
                  }
                  return patientToCheckIn.heure;
                }
                if (patientToCheckIn.date_rdv) {
                  const date = new Date(patientToCheckIn.date_rdv);
                  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                }
                return undefined;
              })(),
              motif: patientToCheckIn.motif,
              medecin: `Dr. ${stats?.medecin?.prenom || ''} ${stats?.medecin?.nom || ''}`.trim(),
              age: patientToCheckIn.age
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MedecinDashboard;
