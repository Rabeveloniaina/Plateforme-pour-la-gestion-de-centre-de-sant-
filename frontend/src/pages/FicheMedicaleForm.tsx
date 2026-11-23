import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, AlertCircle, CheckCircle, ArrowLeft, Save, X, 
  User, Calendar, Stethoscope, Heart, Thermometer, Activity,
  ArrowRight, Users, Phone, Mail, Search, Pill, Plus, Trash2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { api } from '../lib/api';
import { apiFetch } from '../utils/apiFetch';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
}

interface FicheMedicaleFormData {
  id_patient: number;
  date_consultation: string;
  motif_consultation: string;
  symptomes: string;
  diagnostic: string;
  traitement_prescrit: string;
  examens_demandes: string;
  notes: string;
  poids?: number;
  taille?: number;
  temperature?: number;
  tension_arterielle?: string;
  frequence_cardiaque?: number;
  frequence_respiratoire?: number;
}

const FicheMedicaleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  
  // Récupérer les paramètres URL (patient_id, rdv_id, motif)
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patient_id');
  const rdvIdFromUrl = searchParams.get('rdv_id');
  const motifFromUrl = searchParams.get('motif');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // État pour le centre_id actuel (du RDV ou du médecin)
  const [currentCentreId, setCurrentCentreId] = useState<number | null>(null);
  const [rdvData, setRdvData] = useState<any>(null);
  
  // États pour redirection spécialiste
  const [showRedirectionModal, setShowRedirectionModal] = useState(false);
  const [specialistes, setSpecialistes] = useState<any[]>([]);
  const [loadingSpecialistes, setLoadingSpecialistes] = useState(false);
  const [searchSpecialiste, setSearchSpecialiste] = useState('');
  
  // État pour les prescriptions
  interface Prescription {
    medicament: string;
    dosage: string;
    frequence: string;
    duree: string;
  }
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [formData, setFormData] = useState<FicheMedicaleFormData>({
    id_patient: patientIdFromUrl ? parseInt(patientIdFromUrl) : 0,
    date_consultation: new Date().toISOString().split('T')[0],
    motif_consultation: motifFromUrl || '',
    symptomes: '',
    diagnostic: '',
    traitement_prescrit: '',
    examens_demandes: '',
    notes: '',
    poids: undefined,
    taille: undefined,
    temperature: undefined,
    tension_arterielle: '',
    frequence_cardiaque: undefined,
    frequence_respiratoire: undefined
  });

  // Charger les données du RDV si rdv_id est présent
  const fetchRendezVousData = async (rdvId: string) => {
    try {
      const response = await apiFetch(`/rendez-vous/${rdvId}`);
      if (response.ok) {
        const data = await response.json();
        const rdv = data.data || data;
        
        console.log('📋 Données RDV récupérées:', rdv);
        
        // Stocker les données du RDV
        setRdvData(rdv);
        
        // Récupérer le centre_id du RDV (prioritaire pour la recherche de médecins)
        if (rdv.centre_id) {
          setCurrentCentreId(rdv.centre_id);
          console.log('📍 Centre ID du RDV stocké:', rdv.centre_id);
        } else {
          console.log('⚠️ Pas de centre_id dans le RDV');
        }
        
        // Extraire le motif
        let motif = '';
        if (rdv.symptomes) {
          try {
            const symptomesParsed = typeof rdv.symptomes === 'string' 
              ? JSON.parse(rdv.symptomes) 
              : rdv.symptomes;
            
            if (symptomesParsed.motif) {
              motif = symptomesParsed.motif;
            } else if (typeof symptomesParsed === 'string') {
              motif = symptomesParsed;
            }
          } catch (e) {
            if (typeof rdv.symptomes === 'string') {
              motif = rdv.symptomes;
            }
          }
        }
        
        // Extraire les symptômes
        let symptomesText = '';
        if (rdv.symptomes) {
          try {
            const symptomesParsed = typeof rdv.symptomes === 'string' 
              ? JSON.parse(rdv.symptomes) 
              : rdv.symptomes;
            
            if (Array.isArray(symptomesParsed.symptomes)) {
              symptomesText = symptomesParsed.symptomes.join(', ');
            } else if (Array.isArray(symptomesParsed)) {
              symptomesText = symptomesParsed.join(', ');
            }
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        }
        
        // Mettre à jour le formulaire avec les données du RDV
        const patientId = rdv.patient_id;
        if (patientId) {
          setFormData(prev => ({
            ...prev,
            id_patient: patientId,
            motif_consultation: motif || motifFromUrl || prev.motif_consultation,
            symptomes: symptomesText || prev.symptomes
          }));
        }
        
        console.log('✅ Données du RDV chargées:', { motif, symptomesText, patientId, centre_id: rdv.centre_id });
      }
    } catch (error) {
      console.error('Erreur chargement données RDV:', error);
      // Ne pas bloquer si l'erreur survient, on utilise les données de l'URL
    }
  };

  // Charger les patients au démarrage
  useEffect(() => {
    fetchPatients();
    if (isEdit) {
      fetchFiche();
    }
  }, [id]);
  
  // Pré-remplir le patient et le motif quand les patients sont chargés
  useEffect(() => {
    if (patients.length === 0) return; // Attendre que les patients soient chargés
    
    // Pré-remplir le patient et le motif si passés en URL
    if (patientIdFromUrl) {
      console.log('📋 Patient pré-sélectionné:', patientIdFromUrl);
      const patientId = parseInt(patientIdFromUrl);
      setFormData(prev => ({
        ...prev,
        id_patient: patientId,
        motif_consultation: motifFromUrl || prev.motif_consultation
      }));
      
      // Trouver et définir le patient sélectionné
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
    
    // Charger les données du RDV si rdv_id est présent (pour récupérer motif et symptômes)
    if (rdvIdFromUrl && !isEdit) {
      console.log('📋 Chargement des données du RDV:', rdvIdFromUrl);
      fetchRendezVousData(rdvIdFromUrl);
    }
  }, [patientIdFromUrl, motifFromUrl, rdvIdFromUrl, patients, isEdit]);
  
  // Mettre à jour le patient sélectionné quand le formulaire change
  useEffect(() => {
    if (formData.id_patient > 0 && patients.length > 0) {
      const patient = patients.find(p => p.id === formData.id_patient);
      if (patient) {
        setSelectedPatient(patient);
      } else {
        setSelectedPatient(null);
      }
    } else if (formData.id_patient === 0) {
      setSelectedPatient(null);
    }
  }, [formData.id_patient, patients]);
  
  const handleAddPrescription = () => {
    setPrescriptions([...prescriptions, { medicament: '', dosage: '', frequence: '', duree: '' }]);
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index: number, field: keyof Prescription, value: string) => {
    const newPrescriptions = [...prescriptions];
    newPrescriptions[index][field] = value;
    setPrescriptions(newPrescriptions);
  };

  const handleRedirectionSpecialiste = async () => {
    if (!formData.id_patient) {
      showToast('Veuillez d\'abord sélectionner un patient', 'error');
      return;
    }
    setShowRedirectionModal(true);
    setSearchSpecialiste('');
    setSpecialistes([]);
  };
  

  const handleSearchSpecialistes = async () => {
    if (!formData.id_patient) {
      showToast('Veuillez d\'abord sélectionner un patient', 'error');
      return;
    }
    
    if (!searchSpecialiste || !searchSpecialiste.trim()) {
      showToast('Veuillez saisir un prénom, nom ou spécialité', 'error');
      return;
    }
    
    setLoadingSpecialistes(true);
    try {
      // Déterminer le centre_id à utiliser (priorité : RDV > Médecin > Patient)
      let centreIdToUse: number | null = null;
      let centreIdSource = '';
      
      // 1. Priorité : Centre du RDV (si disponible)
      if (currentCentreId) {
        centreIdToUse = currentCentreId;
        centreIdSource = 'RDV';
        console.log('📍 Utilisation du centre_id du RDV:', centreIdToUse);
      } 
      // 2. Sinon : Centre du médecin connecté
      else if (user?.id_centre || user?.centre_id) {
        centreIdToUse = user.id_centre || user.centre_id;
        centreIdSource = 'Médecin connecté';
        console.log('📍 Utilisation du centre_id du médecin connecté:', centreIdToUse);
      }
      // 3. Sinon : Centre du patient (fallback)
      else {
        const patientResponse = await apiFetch(`/patients/${formData.id_patient}`);
        if (!patientResponse.ok) {
          throw new Error('Impossible de récupérer les informations du patient');
        }
        
        const patientData = await patientResponse.json();
        centreIdToUse = patientData.data?.centre_id || patientData.centre_id;
        centreIdSource = 'Patient';
        console.log('📍 Utilisation du centre_id du patient:', centreIdToUse);
      }
      
      console.log('🔍 Recherche médecins:', {
        searchTerm: searchSpecialiste,
        patientId: formData.id_patient,
        centreIdToUse: centreIdToUse,
        centreIdSource: centreIdSource,
        currentCentreId: currentCentreId,
        rdvData: rdvData,
        userCentreId: user?.id_centre || user?.centre_id
      });
      
      if (!centreIdToUse) {
        showToast('Impossible de déterminer le centre pour la recherche', 'error');
        console.error('❌ Aucun centre_id disponible:', { currentCentreId, user, patientData });
        return;
      }
      
      // Rechercher les spécialistes dans le centre actuel par prénom, nom ou spécialité
      const searchUrl = `/medecins/specialistes?search=${encodeURIComponent(searchSpecialiste.trim())}&centre_id=${centreIdToUse}`;
      console.log('📡 URL de recherche:', searchUrl, `(centre: ${centreIdSource})`);
      
      const response = await apiFetch(searchUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', response.status, errorData);
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Réponse API:', data);
      console.log('📊 Statistiques:', {
        search_term: data.search_term,
        centre_id: data.centre_id,
        count: data.count,
        centreIdToUse: centreIdToUse,
        centreIdSource: centreIdSource
      });
      
      // Le backend filtre déjà par centre, mais on normalise les IDs pour être sûr
      const centreIdNum = parseInt(String(centreIdToUse));
      const specialistesDuCentre = (data.data || []).map((m: any) => {
        // Normaliser les IDs pour la comparaison
        return {
          ...m,
          id_centre: parseInt(String(m.id_centre || m.centre_id || 0)),
          centre_id: parseInt(String(m.centre_id || m.id_centre || 0))
        };
      }).filter((m: any) => {
        // Vérifier que le médecin est dans le bon centre
        const matches = m.id_centre === centreIdNum || m.centre_id === centreIdNum;
        if (!matches && (m.id_centre || m.centre_id)) {
          console.log(`⚠️ Médecin ${m.prenom} ${m.nom} (centre: ${m.centre_id || m.id_centre}) ne correspond pas au centre recherché (${centreIdNum})`);
        }
        return matches;
      });
      
      console.log('📋 Médecins filtrés:', {
        total: data.data?.length || 0,
        filtrés: specialistesDuCentre.length,
        centreId: centreIdNum,
        centreIdSource: centreIdSource,
        médecins: specialistesDuCentre.map(m => ({
          nom: `${m.prenom} ${m.nom}`,
          specialite: m.specialite,
          centre_id: m.centre_id || m.id_centre
        }))
      });
      
      setSpecialistes(specialistesDuCentre);
      
      if (specialistesDuCentre.length === 0) {
        // Vérifier le diagnostic du backend
        if (data.diagnostic && data.diagnostic.found_inactive) {
          console.log('⚠️ Des médecins ont été trouvés mais ils ne sont pas actifs:', data.diagnostic);
          showToast(
            `Médecin(s) trouvé(s) pour "${searchSpecialiste}" mais avec statut "${data.diagnostic.statuts.join(', ')}". ` +
            `Seuls les médecins actifs peuvent être sélectionnés. Veuillez contacter l'administration pour activer le médecin.`, 
            'warning'
          );
        } else {
          // Vérifier s'il y a des médecins dans le centre mais qui ne correspondent pas à la recherche
          const allMedecinsCentre = data.data || [];
          if (allMedecinsCentre.length > 0) {
            console.log('⚠️ Des médecins existent dans le centre mais ne correspondent pas à la recherche:', allMedecinsCentre);
            showToast(
              `Aucun médecin trouvé pour "${searchSpecialiste}" dans le centre. ` +
              `Essayez avec un autre terme (prénom, nom ou spécialité).`, 
              'warning'
            );
          } else {
            console.log('⚠️ Aucun médecin trouvé dans le centre pour cette recherche');
            // Vérifier si c'est un problème de centre ou de recherche
            if (data.count === 0 && data.centre_id) {
              showToast(
                `Aucun médecin trouvé pour "${searchSpecialiste}" dans le centre actuel (${centreIdSource}). ` +
                `Vérifiez que le terme de recherche correspond à un prénom, nom ou spécialité, ` +
                `et que le médecin est actif.`, 
                'warning'
              );
            } else {
              showToast(
                `Aucun médecin trouvé pour "${searchSpecialiste}". ` +
                `Vérifiez le terme de recherche ou contactez l'administration.`, 
                'warning'
              );
            }
          }
        }
      } else {
        showToast(`${specialistesDuCentre.length} médecin(s) trouvé(s) dans le centre (${centreIdSource})`, 'success');
      }
    } catch (error: any) {
      console.error('❌ Erreur recherche spécialistes:', error);
      showToast(error.message || 'Erreur lors de la recherche de médecins', 'error');
    } finally {
      setLoadingSpecialistes(false);
    }
  };

  // Recherche automatique lors de la frappe (avec debounce) - désactivée pour éviter les boucles
  // La recherche se fait uniquement quand l'utilisateur clique sur le bouton "Rechercher"
  
  const handleCreateRDVSpecialiste = async (medecin: any) => {
    try {
      setLoadingSpecialistes(true);
      
      // Utiliser la nouvelle route de rédirection
      const response = await apiFetch('/consultations/rediriger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: formData.id_patient,
          medecin_specialiste_id: medecin.id_medecin,
          fiche_medicale_id: id || null, // ID de la fiche si en mode édition
          rdv_id: rdvIdFromUrl ? parseInt(rdvIdFromUrl) : null, // ID du RDV actuel à terminer
          motif_redirection: `Consultation spécialisée en ${medecin.specialite}`,
          diagnostic_initial: formData.diagnostic || '',
          symptomes: formData.symptomes || '',
          // date_rdv et heure_rdv ne sont plus nécessaires, le backend trouve automatiquement le créneau
          note_medecin: `Patient redirigé pour consultation spécialisée en ${medecin.specialite}. Diagnostic initial: ${formData.diagnostic || 'Non spécifié'}`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const creneauInfo = data.data.creneau_automatique 
          ? ` (créneau automatique: ${data.data.date_rdv} à ${data.data.heure_rdv})`
          : '';
        const rdvTermineInfo = data.data.rdv_actuel_termine 
          ? ' Consultation actuelle terminée.' 
          : '';
        
        showToast(
          `Patient redirigé vers Dr. ${medecin.prenom} ${medecin.nom} (${medecin.specialite}).${creneauInfo}${rdvTermineInfo}`, 
          'success'
        );
        setShowRedirectionModal(false);
        
        // Attendre un peu pour que l'utilisateur voie le message, puis rediriger vers le dashboard
        setTimeout(() => {
          navigate('/medecin/dashboard');
        }, 1500);
      } else {
        showToast(data.message || 'Erreur lors de la rédirection', 'error');
      }
    } catch (error: any) {
      console.error('Erreur rédirection spécialiste:', error);
      const errorMessage = error.message || 'Erreur lors de la rédirection vers le spécialiste';
      showToast(errorMessage, 'error');
    } finally {
      setLoadingSpecialistes(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiFetch('/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement patients:', error);
    }
  };

  const fetchFiche = async () => {
    try {
      const response = await apiFetch(`/consultations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          id_patient: data.data.patient_id || data.data.id_patient,
          date_consultation: data.data.date_consultation.split('T')[0],
          motif_consultation: data.data.motif_consultation || '',
          symptomes: data.data.symptomes || '',
          diagnostic: data.data.diagnostic_principal || data.data.diagnostic || '',
          traitement_prescrit: data.data.recommandations || data.data.traitement_prescrit || '',
          examens_demandes: data.data.examens_demandes || '',
          notes: data.data.observations_medecin || data.data.notes || '',
          poids: data.data.poids,
          taille: data.data.taille,
          temperature: data.data.temperature,
          tension_arterielle: data.data.tension_arterielle || '',
          frequence_cardiaque: data.data.frequence_cardiaque,
          frequence_respiratoire: data.data.frequence_respiratoire
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement fiche:', error);
      const errorMsg = error instanceof ApiError ? error.getMessage() : 'Erreur lors du chargement de la consultation';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit 
        ? `/consultations/${id}`
        : '/consultations';

      // Préparer les données avec rdv_id si disponible
      const submitData: any = {
        ...formData,
        prescriptions: prescriptions.filter(p => p.medicament && p.dosage) // Filtrer les prescriptions vides
      };

      // Si rdv_id existe, l'inclure et demander à terminer le RDV
      if (rdvIdFromUrl) {
        submitData.rdv_id = parseInt(rdvIdFromUrl);
        submitData.terminer_rdv = true; // Demander au backend de terminer le RDV automatiquement
        console.log('📋 Consultation liée au RDV:', rdvIdFromUrl);
      }

      const response = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(submitData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success || response.ok) {
        // Construire le message de succès avec la durée réelle si disponible
        let successMsg = rdvIdFromUrl 
          ? 'Consultation enregistrée et rendez-vous terminé avec succès'
          : `Consultation ${isEdit ? 'modifiée' : 'créée'} avec succès`;
        
        if (data.data?.duree_reelle_minutes) {
          successMsg += ` (Durée: ${data.data.duree_reelle_minutes} min)`;
        }
        
        showToast(successMsg, 'success');
        
        // Rafraîchir automatiquement toutes les données si c'était lié à un RDV
        if (rdvIdFromUrl) {
          // Déclencher plusieurs événements pour rafraîchir toutes les vues
          window.dispatchEvent(new Event('refresh-file-attente'));
          window.dispatchEvent(new Event('refresh-patients-aujourdhui'));
          window.dispatchEvent(new Event('refresh-stats'));
          
          // Petit délai pour laisser le temps au backend de finaliser
          setTimeout(() => {
            navigate('/medecin/dashboard');
          }, 1000);
        } else {
          // Si pas de RDV, rediriger immédiatement
          setTimeout(() => {
            navigate('/medecin/dashboard');
          }, 1500);
        }
      } else {
        const errorMsg = data.message || 'Erreur lors de l\'enregistrement';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (error: any) {
      const errorMsg = error instanceof ApiError ? error.getMessage() : 'Erreur de connexion au serveur';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to="/fiches-medicales" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux fiches médicales
          </Link>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Modifier la fiche médicale' : 'Nouvelle fiche médicale'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEdit ? 'Modifier les informations de consultation' : 'Créer une nouvelle fiche de consultation'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Erreur</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Succès</h3>
              <p className="text-green-700">
                {isEdit ? 'Fiche médicale modifiée avec succès !' : 'Fiche médicale créée avec succès !'}
              </p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-600" />
              Informations générales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <select
                  required
                  value={formData.id_patient}
                  onChange={(e) => {
                    const newPatientId = Number(e.target.value);
                    setFormData({ ...formData, id_patient: newPatientId });
                    const patient = patients.find(p => p.id === newPatientId);
                    setSelectedPatient(patient || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isEdit || (patientIdFromUrl !== null && formData.id_patient > 0)}
                  title={patientIdFromUrl && formData.id_patient > 0 ? "Patient pré-sélectionné depuis le RDV" : ""}
                >
                  <option value={0}>Sélectionner un patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.nom} {patient.prenom}
                    </option>
                  ))}
                </select>
                {patientIdFromUrl && formData.id_patient > 0 && selectedPatient && (
                  <p className="mt-1 text-sm text-gray-500">
                    ✓ Patient sélectionné automatiquement : <span className="font-semibold text-gray-700">{selectedPatient.prenom} {selectedPatient.nom}</span>
                  </p>
                )}
                {!patientIdFromUrl && selectedPatient && (
                  <p className="mt-1 text-sm text-gray-500">
                    ✓ Patient sélectionné : <span className="font-semibold text-gray-700">{selectedPatient.prenom} {selectedPatient.nom}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de consultation *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_consultation}
                  onChange={(e) => setFormData({ ...formData, date_consultation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif de consultation *
                </label>
                <input
                  type="text"
                  required
                  value={formData.motif_consultation}
                  onChange={(e) => setFormData({ ...formData, motif_consultation: e.target.value })}
                  placeholder="Ex: Fièvre, Douleur abdominale..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {rdvIdFromUrl && formData.motif_consultation && (
                  <p className="mt-1 text-sm text-gray-500">
                    ✓ Motif pré-rempli depuis le rendez-vous (modifiable)
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Signes vitaux */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-600" />
              Signes vitaux
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Thermometer className="w-4 h-4 inline mr-2" />
                  Température (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature || ''}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  placeholder="37.0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Heart className="w-4 h-4 inline mr-2" />
                  Tension artérielle
                </label>
                <input
                  type="text"
                  value={formData.tension_arterielle}
                  onChange={(e) => setFormData({ ...formData, tension_arterielle: e.target.value })}
                  placeholder="120/80"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence cardiaque (bpm)
                </label>
                <input
                  type="number"
                  value={formData.frequence_cardiaque || ''}
                  onChange={(e) => setFormData({ ...formData, frequence_cardiaque: parseInt(e.target.value) })}
                  placeholder="70"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.poids || ''}
                  onChange={(e) => setFormData({ ...formData, poids: parseFloat(e.target.value) })}
                  placeholder="70.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.taille || ''}
                  onChange={(e) => setFormData({ ...formData, taille: parseFloat(e.target.value) })}
                  placeholder="170"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence respiratoire (/min)
                </label>
                <input
                  type="number"
                  value={formData.frequence_respiratoire || ''}
                  onChange={(e) => setFormData({ ...formData, frequence_respiratoire: parseInt(e.target.value) })}
                  placeholder="16"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Examen clinique */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-indigo-600" />
              Examen clinique
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptômes
                </label>
                <textarea
                  value={formData.symptomes}
                  onChange={(e) => setFormData({ ...formData, symptomes: e.target.value })}
                  rows={3}
                  placeholder="Description détaillée des symptômes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnostic *
                </label>
                <textarea
                  required
                  value={formData.diagnostic}
                  onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                  rows={3}
                  placeholder="Diagnostic médical..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traitement prescrit
                </label>
                <textarea
                  value={formData.traitement_prescrit}
                  onChange={(e) => setFormData({ ...formData, traitement_prescrit: e.target.value })}
                  rows={3}
                  placeholder="Traitement recommandé..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Examens demandés
                </label>
                <textarea
                  value={formData.examens_demandes}
                  onChange={(e) => setFormData({ ...formData, examens_demandes: e.target.value })}
                  rows={3}
                  placeholder="Examens complémentaires à effectuer..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes et observations
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Notes supplémentaires..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Section Prescriptions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-green-600" />
                Prescriptions
              </h3>
              <button
                type="button"
                onClick={handleAddPrescription}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un médicament</span>
              </button>
            </div>

            {prescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune prescription pour le moment</p>
                <p className="text-sm mt-1">Cliquez sur "Ajouter un médicament" pour commencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Pill className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">Médicament {index + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePrescription(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom du médicament *
                        </label>
                        <input
                          type="text"
                          value={prescription.medicament}
                          onChange={(e) => handlePrescriptionChange(index, 'medicament', e.target.value)}
                          placeholder="Ex: Paracétamol"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={prescription.dosage}
                          onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                          placeholder="Ex: 500mg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fréquence
                        </label>
                        <input
                          type="text"
                          value={prescription.frequence}
                          onChange={(e) => handlePrescriptionChange(index, 'frequence', e.target.value)}
                          placeholder="Ex: 3 fois/jour"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durée du traitement
                        </label>
                        <input
                          type="text"
                          value={prescription.duree}
                          onChange={(e) => handlePrescriptionChange(index, 'duree', e.target.value)}
                          placeholder="Ex: 7 jours"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Section Redirection Spécialiste */}
          {formData.id_patient > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <ArrowRight className="w-5 h-5 mr-2 text-purple-600" />
                    Redirection vers spécialiste
                  </h3>
                  <p className="text-sm text-gray-600">
                    Si nécessaire, vous pouvez rediriger ce patient vers un spécialiste
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRedirectionSpecialiste}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Rediriger vers spécialiste</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/fiches-medicales')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Modifier' : 'Enregistrer'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal Redirection Spécialiste */}
        {showRedirectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <ArrowRight className="w-6 h-6 mr-2 text-purple-600" />
                    Redirection vers spécialiste
                  </h3>
                  <button
                    onClick={() => setShowRedirectionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Information sur la rédirection */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium mb-1">
                        Rédirection dans le centre uniquement
                      </p>
                      <p className="text-xs text-blue-700">
                        Seuls les médecins spécialistes du même centre que le patient seront affichés. 
                        Un rendez-vous sera automatiquement créé avec le spécialiste sélectionné.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recherche par prénom, nom ou spécialité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher un médecin *
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={searchSpecialiste}
                        onChange={(e) => setSearchSpecialiste(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchSpecialiste && searchSpecialiste.trim() && formData.id_patient && !loadingSpecialistes) {
                            e.preventDefault();
                            handleSearchSpecialistes();
                          }
                        }}
                        placeholder="Prénom, nom ou spécialité (ex: Dr. Diallo, Cardiologie...)"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!formData.id_patient || loadingSpecialistes}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchSpecialistes}
                      disabled={!searchSpecialiste || !searchSpecialiste.trim() || !formData.id_patient || loadingSpecialistes}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Rechercher</span>
                    </button>
                  </div>
                  {!formData.id_patient && (
                    <p className="mt-1 text-xs text-red-600">
                      ⚠️ Veuillez d'abord sélectionner un patient
                    </p>
                  )}
                  {searchSpecialiste && searchSpecialiste.trim().length > 0 && searchSpecialiste.trim().length < 2 && (
                    <p className="mt-1 text-xs text-gray-500">
                      💡 Saisissez au moins 2 caractères pour rechercher
                    </p>
                  )}
                </div>

                {/* Liste spécialistes */}
                {loadingSpecialistes && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Recherche en cours...</p>
                  </div>
                )}

                {!loadingSpecialistes && specialistes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Spécialistes disponibles ({specialistes.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {specialistes.map((medecin) => (
                        <motion.div
                          key={medecin.id_medecin}
                          whileHover={{ scale: 1.02 }}
                          className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">
                                Dr. {medecin.prenom} {medecin.nom}
                              </h5>
                              <p className="text-sm text-gray-600 mt-1">{medecin.specialite}</p>
                              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                {medecin.centre_nom && (
                                  <span className="flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {medecin.centre_nom}
                                  </span>
                                )}
                                {medecin.telephone && (
                                  <span className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {medecin.telephone}
                                  </span>
                                )}
                                {medecin.email && (
                                  <span className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {medecin.email}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  medecin.statut === 'actif' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {medecin.statut === 'actif' ? 'Disponible' : medecin.statut}
                                </span>
                                {medecin.centre_nom && (
                                  <span className="text-xs text-purple-600 font-medium flex items-center">
                                    📍 {medecin.centre_nom}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleCreateRDVSpecialiste(medecin)}
                              className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                            >
                              <ArrowRight className="w-4 h-4" />
                              <span>Choisir</span>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {!loadingSpecialistes && searchSpecialiste && searchSpecialiste.trim().length >= 2 && specialistes.length === 0 && (
                  <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-2">
                      Aucun médecin trouvé
                    </p>
                    <p className="text-sm text-gray-600">
                      Aucun médecin correspondant à <strong>"{searchSpecialiste}"</strong> n'est disponible dans le centre du patient pour le moment.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      La rédirection est limitée aux médecins du même centre que le patient. Essayez avec un autre terme de recherche.
                    </p>
                  </div>
                )}

                {!loadingSpecialistes && (!searchSpecialiste || searchSpecialiste.trim().length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-2">
                      Rechercher un médecin
                    </p>
                    <p className="text-sm text-gray-600">
                      Saisissez un prénom, nom ou spécialité pour rechercher un médecin dans le centre du patient.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowRedirectionModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FicheMedicaleForm;

