import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface MedecinFormData {
  nom: string;
  prenom: string;
  sexe?: 'M' | 'F';
  date_naissance?: string;
  specialite: string;
  numero_licence?: string;
  diplome?: string;
  experience?: number;
  telephone: string;
  email: string;
  centre_id: number;
  statut: 'actif' | 'inactif' | 'conges' | 'retraite';
  horaires: {
    debut: string;
    fin: string;
    jours: string[];
  };
  notes_administratives: string;
}

interface Centre {
  id: number;
  id_centre?: number;
  nom: string;
  adresse: string;
  region_nom?: string;
}

const MedecinForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);

  // Récupérer le chemin de retour depuis l'état de navigation
  const returnPath = (location.state as any)?.returnPath || '/medecins';
  const returnTab = (location.state as any)?.returnTab;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<MedecinFormData>({
    nom: '',
    prenom: '',
    sexe: 'M',
    date_naissance: '',
    specialite: '',
    numero_licence: '',
    telephone: '',
    email: '',
    centre_id: 0,
    statut: 'actif',
    horaires: {
      debut: '08:00',
      fin: '17:00',
      jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    notes_administratives: ''
  });

  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Déterminer si l'utilisateur est admin_centre
  const isAdminCentre = user?.role === 'admin_centre' || user?.role === 'medecin' || user?.role === 'personnel';

  useEffect(() => {
    if (isAdminCentre) {
      // Pour admin_centre : charger uniquement son centre
      fetchUserCentre();
    } else {
      // Pour ministère : charger tous les centres
      fetchCentres();
    }

    if (isEdit) {
      fetchMedecinData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, isAdminCentre]);

  const fetchUserCentre = async () => {
    try {
      const userIdCentre = (user as any)?.id_centre;
      if (userIdCentre) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/centres/${userIdCentre}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const data = result.data || result;
        setFormData(prev => ({ ...prev, centre_id: data.id_centre || data.id }));
        console.log('✅ Centre de l\'utilisateur chargé:', data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du centre:', error);
    }
  };

  const fetchCentres = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/centres', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        const centresData: Centre[] = data.data.map((c: any) => ({
          id: c.id_centre,
          nom: c.nom,
          adresse: c.adresse
        }));
        setCentres(centresData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des centres:', error);
    }
  };

  const fetchMedecinData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/medecins/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Données médecin récupérées:', data);

      if (data.success && data.data) {
        const medecin = data.data;

        // Parser les horaires si c'est une chaîne JSON
        let horaires = medecin.horaires;
        if (typeof horaires === 'string') {
          try {
            horaires = JSON.parse(horaires);
          } catch {
            console.warn('Erreur parsing horaires, utilisation des valeurs par défaut');
            horaires = null;
          }
        }

        // Parser disponibilite si c'est une chaîne JSON (non utilisé mais pour cohérence)
        if (typeof medecin.disponibilite === 'string') {
          try {
            JSON.parse(medecin.disponibilite);
          } catch {
            // Ignore parsing error
          }
        }

        // Préremplir tous les champs du formulaire
        setFormData({
          nom: medecin.nom || '',
          prenom: medecin.prenom || '',
          sexe: (medecin.sexe as 'M' | 'F') || 'M',
          date_naissance: medecin.date_naissance ? medecin.date_naissance.split('T')[0] : '', // Format YYYY-MM-DD pour input date
          specialite: medecin.specialite || 'Médecine générale',
          numero_licence: medecin.numero_licence || '',
          telephone: medecin.telephone || '',
          email: medecin.email || '',
          centre_id: medecin.centre_id || 0,
          statut: (medecin.statut as 'actif' | 'inactif' | 'conges' | 'retraite') || 'actif',
          diplome: medecin.diplome || '',
          experience: medecin.experience || undefined,
          horaires: horaires || {
            debut: '08:00',
            fin: '17:00',
            jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
          },
          notes_administratives: medecin.notes_administratives || ''
        });

        console.log('✅ Formulaire prérempli avec les données du médecin');
      } else {
        throw new Error(data.message || 'Données invalides');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement du médecin:', error);
      setErrors({ general: error.message || 'Erreur lors du chargement des données' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleHorairesChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      horaires: {
        ...prev.horaires,
        [field]: value
      }
    }));
  };

  const handleJourChange = (jour: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        horaires: {
          ...prev.horaires,
          jours: [...prev.horaires.jours, jour]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        horaires: {
          ...prev.horaires,
          jours: prev.horaires.jours.filter(j => j !== jour)
        }
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    // Prénom est optionnel pour les malgaches
    // if (!formData.prenom.trim()) {
    //   newErrors.prenom = 'Le prénom est requis';
    // }
    if (!formData.specialite.trim()) {
      newErrors.specialite = 'La spécialité est requise';
    }
    if (!formData.sexe) {
      newErrors.sexe = 'Le sexe est requis';
    }
    if (!formData.date_naissance) {
      newErrors.date_naissance = 'La date de naissance est requise';
    }
    if (!formData.numero_licence || !formData.numero_licence.trim()) {
      newErrors.numero_licence = 'Le numéro de licence est requis';
    }
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    // Centre requis SEULEMENT pour le ministère
    if (!isAdminCentre && !formData.centre_id) {
      newErrors.centre_id = 'Le centre est requis';
    }
    // date_embauche n'existe pas dans la BD, on ne valide pas

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEdit
        ? `/api/medecins/${id}`
        : '/api/medecins';
      const method = isEdit ? 'PUT' : 'POST';

      // Préparer les données à envoyer (enlever les champs undefined)
      const payload: any = {
        nom: formData.nom,
        prenom: formData.prenom || '', // S'assurer que prenom est une chaîne vide si non fourni
        sexe: formData.sexe,
        date_naissance: formData.date_naissance,
        specialite: formData.specialite,
        numero_licence: formData.numero_licence,
        telephone: formData.telephone,
        email: formData.email,
        statut: formData.statut,
      };

      // Toujours envoyer centre_id pour satisfaire la validation
      // Pour admin_centre, utiliser directement id_centre de l'utilisateur
      if (isAdminCentre) {
        const userIdCentre = (user as any)?.id_centre;
        if (userIdCentre) {
          payload.centre_id = userIdCentre;
        } else if (formData.centre_id && formData.centre_id > 0) {
          payload.centre_id = formData.centre_id;
        }
      } else if (formData.centre_id && formData.centre_id > 0) {
        payload.centre_id = formData.centre_id;
      }

      // Ajouter les champs optionnels s'ils sont présents
      if (formData.diplome) payload.diplome = formData.diplome;
      if (formData.experience) payload.experience = formData.experience;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Afficher l'erreur spécifique du backend
        const errorMessage = data.message || data.error || 'Erreur lors de la sauvegarde';

        // Gérer les erreurs de validation (tableau errors)
        const newErrors: Record<string, string> = {};
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: any) => {
            if (err.msg) {
              const field = err.param || err.path || 'general';
              newErrors[field] = err.msg;
            }
          });
        }

        // Si pas d'erreurs spécifiques, utiliser le message général
        if (Object.keys(newErrors).length === 0) {
          newErrors.general = errorMessage;
        }

        setErrors(newErrors);
        showToast(errorMessage, 'error');
        return;
      }

      // Succès
      showToast(`Médecin ${isEdit ? 'modifié' : 'enregistré'} avec succès`, 'success');
      showToast(`Médecin ${isEdit ? 'modifié' : 'enregistré'} avec succès`, 'success');

      // Rediriger vers le chemin de retour avec l'onglet actif si nécessaire
      if (returnTab) {
        navigate(returnPath, { state: { activeTab: returnTab } });
      } else {
        navigate(returnPath);
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error.message || 'Erreur réseau lors de la sauvegarde du médecin';
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
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
                onClick={() => {
                  if (returnTab) {
                    navigate(returnPath, { state: { activeTab: returnTab } });
                  } else {
                    navigate(returnPath);
                  }
                }}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Modifier le médecin' : 'Nouveau médecin'}
                </h1>
                <p className="text-gray-600">
                  {isEdit ? 'Modifiez les informations du médecin' : 'Créez un nouveau médecin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Message d'erreur générale */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Informations personnelles */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.nom ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Martin"
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.nom}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-xs text-gray-500">(optionnel)</span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.prenom ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Dr. Jean (optionnel)"
                />
                {errors.prenom && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.prenom}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialité <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.specialite ? 'border-red-300' : 'border-gray-300'
                    }`}
                >
                  <option value="">Sélectionner une spécialité</option>
                  <option value="Médecine générale">Médecine générale</option>
                  <option value="Cardiologie">Cardiologie</option>
                  <option value="Dermatologie">Dermatologie</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                  <option value="Gynécologie">Gynécologie</option>
                  <option value="Neurologie">Neurologie</option>
                  <option value="Orthopédie">Orthopédie</option>
                  <option value="Psychiatrie">Psychiatrie</option>
                </select>
                {errors.specialite && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.specialite}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.telephone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="+33 6 12 34 56 78"
                />
                {errors.telephone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.telephone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="jean.martin@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Centre de santé : SEULEMENT pour le ministère */}
              {!isAdminCentre && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centre de santé <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="centre_id"
                    value={formData.centre_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.centre_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                  >
                    <option value={0}>Sélectionner un centre</option>
                    {centres.map((centre) => (
                      <option key={centre.id_centre || centre.id} value={centre.id_centre || centre.id}>
                        {centre.nom} {centre.region_nom ? `(${centre.region_nom})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.centre_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.centre_id}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="conges">En congés</option>
                  <option value="retraite">Retraité</option>
                </select>
              </div>
            </div>
          </div>

          {/* Champs requis pour la cohérence base */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sexe <span className="text-red-500">*</span></label>
                <select name="sexe" value={formData.sexe} onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.sexe ? 'border-red-300' : 'border-gray-300'}`}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                {errors.sexe && (<p className="mt-1 text-sm text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" />{errors.sexe}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance <span className="text-red-500">*</span></label>
                <input type="date" name="date_naissance" value={formData.date_naissance || ''} onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.date_naissance ? 'border-red-300' : 'border-gray-300'}`} />
                {errors.date_naissance && (<p className="mt-1 text-sm text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" />{errors.date_naissance}</p>)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de licence <span className="text-red-500">*</span></label>
                <input type="text" name="numero_licence" value={formData.numero_licence || ''} onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.numero_licence ? 'border-red-300' : 'border-gray-300'}`} placeholder="LIC-XXXX-YYYY" />
                {errors.numero_licence && (<p className="mt-1 text-sm text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" />{errors.numero_licence}</p>)}
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Clock className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Horaires de travail</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heure de début</label>
                <input
                  type="time"
                  value={formData.horaires.debut}
                  onChange={(e) => handleHorairesChange('debut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heure de fin</label>
                <input
                  type="time"
                  value={formData.horaires.fin}
                  onChange={(e) => handleHorairesChange('fin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Jours de travail</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((jour) => (
                  <label key={jour} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.horaires.jours.includes(jour)}
                      onChange={(e) => handleJourChange(jour, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{jour}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Notes administratives */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notes administratives</h2>
            </div>

            <textarea
              name="notes_administratives"
              value={formData.notes_administratives}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notes administratives du médecin..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                if (returnTab) {
                  navigate(returnPath, { state: { activeTab: returnTab } });
                } else {
                  navigate(returnPath);
                }
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Sauvegarde...' : (isEdit ? 'Modifier' : 'Créer')}</span>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedecinForm;