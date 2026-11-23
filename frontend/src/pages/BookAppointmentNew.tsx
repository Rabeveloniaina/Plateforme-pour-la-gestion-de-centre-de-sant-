import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Building, User, Phone, Mail, Stethoscope, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/apiFetch';
import { parseLocalDate } from '../utils/dateFormatter';

interface Region {
  id_region: number;
  nom: string;
  code_region: string;
}

interface Centre {
  id_centre: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
}

interface Medecin {
  id_medecin: number;
  nom: string;
  prenom: string;
  specialite: string;
  telephone: string;
  email: string;
  statut: string;
  statut_operationnel?: 'disponible' | 'en_consultation' | 'pause' | 'indisponible';
}

const BookAppointmentNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    region_id: '',
    centre_id: '',
    medecin_id: '',
    date_rdv: '',
    heure_rdv: '',
    motif: '',
    symptomes: '',
    intensite: 'moderee', // legere, moderee, severe
    note_patient: '',
    duree_estimee: 30, // durée estimée en minutes
    duree_symptomes: '',
    antecedents_similaires: '',
    orientation: 'auto' // 'auto' pour orientation automatique
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Charger les régions et les informations du patient au démarrage
  useEffect(() => {
    loadRegions();
    loadPatientInfo();
  }, []);

  // Charger les centres quand la région change (sauf lors du chargement initial)
  useEffect(() => {
    // Ne pas charger les centres si c'est le chargement initial
    // car loadPatientInfo s'en charge déjà
    if (isInitialLoad) {
      return;
    }

    if (formData.region_id) {
      loadCentresByRegion(Number(formData.region_id));
    } else {
      setCentres([]);
      setMedecins([]);
      setFormData(prev => ({ ...prev, centre_id: '', medecin_id: '' }));
    }
  }, [formData.region_id, isInitialLoad]);

  // Charger les médecins quand le centre change OU quand la date/heure change
  useEffect(() => {
    if (formData.centre_id) {
      loadMedecinsByCentre(Number(formData.centre_id), formData.date_rdv, formData.heure_rdv);
    } else {
      setMedecins([]);
      setFormData(prev => ({ ...prev, medecin_id: '' }));
    }
  }, [formData.centre_id, formData.date_rdv, formData.heure_rdv]);

  const loadPatientInfo = async () => {
    try {
      console.log('🔍 Chargement des informations du patient...');
      const response = await apiFetch('/patients/me');

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const patient = data.data;
          console.log('✅ Informations patient chargées:', { region_id: patient.region_id, centre_id: patient.centre_id });

          // Pré-remplir le formulaire avec la région et le centre de base du patient
          if (patient.region_id) {
            setFormData(prev => ({ ...prev, region_id: patient.region_id.toString() }));
            // Charger les centres de cette région et pré-remplir le centre_id si disponible
            await loadCentresByRegion(patient.region_id, patient.centre_id);
          }
        }
      } else {
        console.log('⚠️ Patient non trouvé ou non connecté, formulaire vide');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des informations patient:', error);
      // Ne pas bloquer si l'erreur survient, le formulaire reste vide
    } finally {
      // Marquer que le chargement initial est terminé
      setIsInitialLoad(false);
    }
  };

  const loadRegions = async () => {
    try {
      console.log('🔍 Chargement des régions...');
      const token = localStorage.getItem('token');
      console.log('🔑 Token présent:', token ? 'Oui' : 'Non');

      const response = await apiFetch('/regions', {}, !token);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Données régions reçues:', data);
        console.log('📦 data.data:', data.data);
        console.log('📦 Nombre de régions:', data.data?.length || 0);

        setRegions(data.data || []);

        if (!data.data || data.data.length === 0) {
          setError('⚠️ Aucune région trouvée dans la base de données');
          console.warn('⚠️ Aucune région dans data.data');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorData);
        if (response.status === 401) {
          setError('Vous devez être connecté pour accéder aux régions. Veuillez vous reconnecter.');
        } else {
          setError(`Erreur lors du chargement des régions (${response.status})`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des régions:', error);
      setError('Erreur de connexion au serveur. Vérifiez que le backend est démarré.');
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadCentresByRegion = async (regionId: number, prefillCentreId?: number) => {
    try {
      console.log(`🔍 Chargement des centres pour région ${regionId}${prefillCentreId ? ` (pré-remplir centre ${prefillCentreId})` : ''}...`);
      const token = localStorage.getItem('token');

      const response = await apiFetch(`/regions/${regionId}/centres`, {}, !token);
      console.log('📡 Response status (centres):', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Données centres reçues:', data);
        console.log('📦 Nombre de centres:', data.data?.length || 0);

        setCentres(data.data || []);

        // Si un centre_id est fourni et qu'il existe dans la liste, le pré-remplir
        if (prefillCentreId && data.data) {
          const centreExists = data.data.find((c: Centre) => c.id_centre === prefillCentreId);
          if (centreExists) {
            console.log(`✅ Pré-remplissage du centre ${prefillCentreId}`);
            setFormData(prev => ({ ...prev, centre_id: prefillCentreId.toString() }));
          } else {
            console.log(`⚠️ Centre ${prefillCentreId} non trouvé dans la région ${regionId}`);
          }
        }

        if (!data.data || data.data.length === 0) {
          setError(`⚠️ Aucun centre trouvé dans cette région`);
          console.warn('⚠️ Aucun centre dans cette région');
        } else {
          setError(''); // Effacer l'erreur si des centres sont trouvés
        }
      } else {
        console.error('❌ Erreur HTTP (centres):', response.status);
        if (response.status === 401) {
          setError('Vous devez être connecté. Veuillez vous reconnecter.');
        } else {
          setError(`Erreur lors du chargement des centres (${response.status})`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des centres:', error);
      setError('Erreur lors du chargement des centres');
    }
  };

  const loadMedecinsByCentre = async (centreId: number, dateRdv?: string, heureRdv?: string) => {
    try {
      console.log(`🔍 Chargement des médecins disponibles pour centre ${centreId}${dateRdv && heureRdv ? ` le ${dateRdv} à ${heureRdv}` : ''}...`);
      const token = localStorage.getItem('token');

      // Construire l'URL avec les paramètres de date et heure si disponibles
      let url = `/medecins/centre/${centreId}?disponible=true`;
      if (dateRdv && heureRdv) {
        url += `&date_rdv=${encodeURIComponent(dateRdv)}&heure_rdv=${encodeURIComponent(heureRdv)}`;
      }

      const response = await apiFetch(url);
      console.log('📡 Response status (médecins):', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Données médecins reçues:', data);
        console.log('📦 Nombre de médecins disponibles:', data.data?.length || 0);

        // Filtrer uniquement sur le statut système (actif/inactif)
        // Le statut_operationnel (disponible, en_consultation, pause) n'est pas pertinent
        // car on cherche la disponibilité à l'heure du RDV, pas maintenant
        let medecinsDisponibles = (data.data || []).filter((m: Medecin) => {
          // Vérifier que le médecin est actif dans le système
          if (m.statut !== 'actif') {
            console.log(`❌ Médecin ${m.id_medecin} non actif dans le système:`, m.statut);
            return false;
          }

          return true;
        });

        setMedecins(medecinsDisponibles);

        // Réinitialiser la sélection du médecin si le médecin sélectionné n'est plus disponible
        if (formData.medecin_id && !medecinsDisponibles.find((m: Medecin) => m.id_medecin === Number(formData.medecin_id))) {
          setFormData(prev => ({ ...prev, medecin_id: '' }));
          setError(`⚠️ Le médecin précédemment sélectionné n'est plus disponible pour cette date/heure. Veuillez en choisir un autre.`);
        } else if (medecinsDisponibles.length === 0) {
          if (dateRdv && heureRdv) {
            setError(`⚠️ Aucun médecin disponible dans ce centre pour le ${dateRdv} à ${heureRdv}`);
          } else {
            setError(`⚠️ Aucun médecin disponible dans ce centre pour le moment`);
          }
          console.warn('⚠️ Aucun médecin disponible dans ce centre');
        } else {
          setError(''); // Effacer l'erreur si des médecins sont trouvés
        }
      } else {
        console.error('❌ Erreur HTTP (médecins):', response.status);
        setError(`Erreur lors du chargement des médecins (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des médecins:', error);
      setError('Erreur lors du chargement des médecins');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Si la date ou l'heure change, réinitialiser le médecin sélectionné
    // car les médecins disponibles peuvent avoir changé
    if (name === 'date_rdv' || name === 'heure_rdv') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        medecin_id: '' // Réinitialiser la sélection du médecin
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.region_id) {
      setError('Veuillez sélectionner une région');
      return;
    }
    if (!formData.centre_id) {
      setError('Veuillez sélectionner un centre de santé');
      return;
    }
    if (!formData.medecin_id) {
      setError('Veuillez sélectionner un médecin');
      return;
    }
    if (!formData.date_rdv) {
      setError('Veuillez sélectionner une date');
      return;
    }
    if (!formData.heure_rdv) {
      setError('Veuillez sélectionner une heure');
      return;
    }
    if (!formData.motif) {
      setError('Veuillez indiquer le motif de consultation');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Préparer les données pour l'API selon le schéma de la BDD
      const rdvData = {
        centre_id: Number(formData.centre_id),
        medecin_id: Number(formData.medecin_id),
        date_rdv: formData.date_rdv,
        heure_rdv: formData.heure_rdv,
        motif: formData.motif,
        symptomes: formData.symptomes,
        intensite: formData.intensite,
        note_patient: formData.note_patient || '',
        duree_estimee: formData.duree_estimee
      };

      console.log('📤 Envoi des données RDV:', rdvData);

      const response = await apiFetch('/rendez-vous', {
        method: 'POST',
        body: JSON.stringify({
          ...rdvData,
          orientation: formData.orientation || 'auto' // Orientation automatique
        })
      });

      console.log('📡 Response status:', response.status);

      const data = await response.json();

      if (data.success) {
        showToast('Rendez-vous pris avec succès !', 'success');
        setTimeout(() => {
          navigate('/patient/dashboard');
        }, 1500);
      } else {
        const errorMessage = data.message || 'Erreur lors de la prise de rendez-vous';
        setError(errorMessage);
        showToast(errorMessage, 'error');

        // Si le profil patient n'existe pas, rediriger vers la page de complétion
        if (data.message && data.message.includes('Profil patient non trouvé')) {
          setTimeout(() => {
            navigate('/patient/complete-profile');
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      const errorMessage = error.message || 'Erreur lors de la prise de rendez-vous';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir la date minimale (aujourd'hui)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loadingRegions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prendre un rendez-vous</h1>
          <p className="text-gray-600 mt-2">Planifiez votre consultation médicale</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center"
          >
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800">{success}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Localisation */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-purple-600" />
              Localisation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Région */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Région *
                </label>
                <select
                  name="region_id"
                  value={formData.region_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une région</option>
                  {regions.map(region => (
                    <option key={region.id_region} value={region.id_region}>
                      {region.nom}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Choisissez votre région pour voir les centres disponibles
                </p>
              </div>

              {/* Centre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centre de santé *
                </label>
                <select
                  name="centre_id"
                  value={formData.centre_id}
                  onChange={handleChange}
                  disabled={!formData.region_id || centres.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {!formData.region_id
                      ? 'Sélectionnez d\'abord une région'
                      : centres.length === 0
                        ? 'Aucun centre dans cette région'
                        : 'Sélectionner un centre'}
                  </option>
                  {centres.map(centre => (
                    <option key={centre.id_centre} value={centre.id_centre}>
                      {centre.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Centre Info */}
            {formData.centre_id && centres.find(c => c.id_centre === Number(formData.centre_id)) && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-start">
                  <Building className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {centres.find(c => c.id_centre === Number(formData.centre_id))?.nom}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {centres.find(c => c.id_centre === Number(formData.centre_id))?.adresse}
                    </p>
                    <p className="text-sm text-gray-600">
                      <Phone className="w-4 h-4 inline mr-1" />
                      {centres.find(c => c.id_centre === Number(formData.centre_id))?.telephone}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date et Heure - AVANT la sélection du médecin */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Date et heure du rendez-vous
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date * {formData.centre_id && <span className="text-xs text-gray-500">(Sélectionnez d'abord le centre)</span>}
                </label>
                <input
                  type="date"
                  name="date_rdv"
                  value={formData.date_rdv}
                  onChange={handleChange}
                  min={getMinDate()}
                  disabled={!formData.centre_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure *
                </label>
                <input
                  type="time"
                  name="heure_rdv"
                  value={formData.heure_rdv}
                  onChange={handleChange}
                  disabled={!formData.centre_id || !formData.date_rdv}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            {formData.date_rdv && formData.heure_rdv && formData.centre_id && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Recherche des médecins disponibles pour le <strong>{parseLocalDate(formData.date_rdv)?.toLocaleDateString('fr-FR') || formData.date_rdv}</strong> à <strong>{formData.heure_rdv}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Médecin - APRÈS la sélection de date/heure */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Stethoscope className="w-5 h-5 mr-2 text-purple-600" />
              Sélectionner un médecin
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médecin disponible *
              </label>
              <select
                name="medecin_id"
                value={formData.medecin_id}
                onChange={handleChange}
                disabled={!formData.centre_id || !formData.date_rdv || !formData.heure_rdv || medecins.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">
                  {!formData.centre_id
                    ? 'Sélectionnez d\'abord un centre'
                    : !formData.date_rdv
                      ? 'Sélectionnez d\'abord une date'
                      : !formData.heure_rdv
                        ? 'Sélectionnez d\'abord une heure'
                        : medecins.length === 0
                          ? `Aucun médecin disponible le ${formData.date_rdv ? (parseLocalDate(formData.date_rdv)?.toLocaleDateString('fr-FR') || formData.date_rdv) : ''} à ${formData.heure_rdv || ''}`
                          : 'Sélectionner un médecin disponible'}
                </option>
                {medecins.map(medecin => (
                  <option key={medecin.id_medecin} value={medecin.id_medecin}>
                    Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                  </option>
                ))}
              </select>
            </div>

            {/* Médecin Info */}
            {formData.medecin_id && medecins.find(m => m.id_medecin === Number(formData.medecin_id)) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <User className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Dr. {medecins.find(m => m.id_medecin === Number(formData.medecin_id))?.prenom}{' '}
                      {medecins.find(m => m.id_medecin === Number(formData.medecin_id))?.nom}
                    </p>
                    <p className="text-sm text-gray-600">
                      {medecins.find(m => m.id_medecin === Number(formData.medecin_id))?.specialite}
                    </p>
                    {formData.date_rdv && formData.heure_rdv && (
                      <p className="text-xs text-gray-500 mt-1">
                        Disponible le {new Date(formData.date_rdv).toLocaleDateString('fr-FR')} à {formData.heure_rdv}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formData.centre_id && formData.date_rdv && formData.heure_rdv && medecins.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <Stethoscope className="w-4 h-4 inline mr-1" />
                  Aucun médecin disponible dans ce centre pour le <strong>{new Date(formData.date_rdv).toLocaleDateString('fr-FR')}</strong> à <strong>{formData.heure_rdv}</strong>.
                  Veuillez choisir une autre date ou heure.
                </p>
              </div>
            )}
          </div>

          {/* Motif et Symptômes */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Informations sur la consultation
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif de consultation *
                </label>
                <input
                  type="text"
                  name="motif"
                  value={formData.motif}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Consultation générale, Suivi, Contrôle..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Questionnaire de symptômes *
                </label>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Répondez aux questions suivantes pour une meilleure orientation
                  </p>

                  {/* Symptômes principaux */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptômes principaux (séparez par des virgules) *
                    </label>
                    <textarea
                      name="symptomes"
                      value={formData.symptomes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: fièvre, toux, maux de tête, douleur thoracique..."
                      required
                    />
                  </div>

                  {/* Questions complémentaires */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Durée des symptômes
                      </label>
                      <select
                        name="duree_symptomes"
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">Sélectionnez...</option>
                        <option value="<24h">Moins de 24h</option>
                        <option value="1-3j">1 à 3 jours</option>
                        <option value="4-7j">4 à 7 jours</option>
                        <option value=">7j">Plus de 7 jours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Antécédents similaires
                      </label>
                      <select
                        name="antecedents_similaires"
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">Sélectionnez...</option>
                        <option value="non">Non</option>
                        <option value="oui">Oui, similaire</option>
                        <option value="recurrent">Oui, récurrent</option>
                      </select>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    💡 L'orientation (généraliste ou spécialiste) sera déterminée automatiquement selon vos réponses
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intensité des symptômes
                </label>
                <select
                  name="intensite"
                  value={formData.intensite}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="legere">Légère</option>
                  <option value="moderee">Modérée</option>
                  <option value="severe">Sévère</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes supplémentaires (optionnel)
                </label>
                <textarea
                  name="note_patient"
                  value={formData.note_patient}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Informations complémentaires..."
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/patient/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Confirmer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentNew;
