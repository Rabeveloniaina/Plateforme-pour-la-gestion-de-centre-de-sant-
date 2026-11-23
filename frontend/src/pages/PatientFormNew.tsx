import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  CheckCircle,
  Building,
  Globe
} from 'lucide-react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiFetch';

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

interface PatientFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'M' | 'F' | '';
  telephone: string;
  email: string;
  adresse: string;
  region_id: number | '';
  centre_id: number | '';
  groupe_sanguin: string;
  allergies: string[];
  antecedents: string[];
  maladies_chroniques: string[];
}

const PatientFormNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);

  // Récupérer le chemin de retour depuis l'état de navigation
  const returnPath = (location.state as any)?.returnPath || '/patients';
  const returnTab = (location.state as any)?.returnTab;
  const { user } = useAuth();
  const isAdminCentre = user?.role === 'admin_centre' || user?.role === 'medecin' || user?.role === 'personnel';

  const [formData, setFormData] = useState<PatientFormData>({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: '',
    telephone: '',
    email: '',
    adresse: '',
    region_id: '',
    centre_id: '',
    groupe_sanguin: '',
    allergies: [],
    antecedents: [],
    maladies_chroniques: []
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Inputs temporaires pour les listes
  const [allergieInput, setAllergieInput] = useState('');
  const [antecedentInput, setAntecedentInput] = useState('');
  const [maladieInput, setMaladieInput] = useState('');

  useEffect(() => {
    if (!isAdminCentre) {
      fetchRegions();
    } else {
      // Pré-remplir le centre depuis l'utilisateur connecté
      if ((user as any)?.id_centre) {
        setFormData(prev => ({ ...prev, centre_id: (user as any).id_centre }));
      }
    }
    if (isEdit) {
      fetchPatientData();
    }
  }, [id, isEdit, isAdminCentre, (user as any)?.id_centre]);

  // Charger les centres quand la région change
  useEffect(() => {
    if (isAdminCentre) return; // Admin centre ne choisit pas la région/centre
    if (formData.region_id) {
      fetchCentresByRegion(Number(formData.region_id));
    } else {
      setCentres([]);
      setFormData(prev => ({ ...prev, centre_id: '' }));
    }
  }, [formData.region_id, isAdminCentre]);

  const fetchRegions = async () => {
    try {
      const response = await apiFetch('/regions', {}, true); // Public endpoint
      const data = await response.json();
      console.log('🔍 Régions récupérées:', data);
      setRegions(data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des régions:', error);
    }
  };

  const fetchCentresByRegion = async (regionId: number) => {
    try {
      const response = await apiFetch(`/regions/${regionId}/centres`, {}, true); // Public endpoint
      const data = await response.json();
      console.log('🔍 Centres récupérés pour région', regionId, ':', data);
      setCentres(data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des centres:', error);
      setCentres([]);
    }
  };

  const fetchPatientData = async () => {
    try {
      const response = await apiFetch(`/patients/${id}`);
      const data = await response.json();

      if (data.success) {
        const patient = data.data;
        setFormData({
          nom: patient.nom || '',
          prenom: patient.prenom || '',
          date_naissance: patient.date_naissance ? patient.date_naissance.split('T')[0] : '',
          sexe: patient.sexe || '',
          telephone: patient.telephone || '',
          email: patient.email || '',
          adresse: patient.adresse || '',
          region_id: patient.region_id || '',
          // Pour admin_centre, on s'assure que le centre_id est celui de l'utilisateur si non présent
          centre_id: patient.centre_id || (isAdminCentre && (user as any)?.id_centre ? (user as any).id_centre : ''),
          groupe_sanguin: patient.groupe_sanguin || '',
          allergies: patient.allergies ? JSON.parse(patient.allergies) : [],
          antecedents: patient.antecedents ? JSON.parse(patient.antecedents) : [],
          maladies_chroniques: patient.maladies_chroniques ? JSON.parse(patient.maladies_chroniques) : []
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du patient:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addItem = (listName: 'allergies' | 'antecedents' | 'maladies_chroniques', value: string, setValue: (val: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [listName]: [...prev[listName], value.trim()]
      }));
      setValue('');
    }
  };

  const removeItem = (listName: 'allergies' | 'antecedents' | 'maladies_chroniques', index: number) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires selon la DB
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!formData.date_naissance) newErrors.date_naissance = 'La date de naissance est requise';
    if (!formData.sexe) newErrors.sexe = 'Le sexe est requis';
    if (!formData.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!formData.adresse.trim()) newErrors.adresse = 'L\'adresse est requise';

    // Email optionnel mais si renseigné, doit être valide
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Région/Centre requis uniquement pour le ministère (pour admin_centre c'est auto-assigné)
    if (!isAdminCentre) {
      if (!formData.region_id) newErrors.region_id = 'La région est requise';
      if (!formData.centre_id) newErrors.centre_id = 'Le centre est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const url = isEdit
        ? `/patients/${id}`
        : '/patients';

      const response = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          // Rediriger vers le chemin de retour avec l'onglet actif si nécessaire
          if (returnTab) {
            navigate(returnPath, { state: { activeTab: returnTab } });
          } else {
            navigate(returnPath);
          }
        }, 2000);
      } else {
        setErrors({ submit: data.message || 'Erreur lors de l\'enregistrement' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ submit: 'Erreur lors de l\'enregistrement du patient' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (returnTab) {
                navigate(returnPath, { state: { activeTab: returnTab } });
              } else {
                navigate(returnPath);
              }
            }}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Modifier le patient' : 'Nouveau patient'}
          </h1>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center"
          >
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800">
              Patient {isEdit ? 'modifié' : 'créé'} avec succès !
            </span>
          </motion.div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800">{errors.submit}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-purple-600" />
              Informations personnelles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.nom ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Nom du patient"
                />
                {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.prenom ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Prénom du patient"
                />
                {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.date_naissance ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.date_naissance && <p className="mt-1 text-sm text-red-600">{errors.date_naissance}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe *
                </label>
                <select
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.sexe ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                {errors.sexe && <p className="mt-1 text-sm text-red-600">{errors.sexe}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Groupe sanguin <span className="text-xs text-gray-500">(optionnel, peut être renseigné plus tard)</span>
                </label>
                <select
                  name="groupe_sanguin"
                  value={formData.groupe_sanguin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Non renseigné</option>
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
            </div>
          </div>

          {/* Coordonnées */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-purple-600" />
              Coordonnées
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.telephone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="77 123 45 67"
                />
                {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-xs text-gray-500">(optionnel)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="patient@email.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse *
                </label>
                <textarea
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.adresse ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Adresse complète du patient"
                />
                {errors.adresse && <p className="mt-1 text-sm text-red-600">{errors.adresse}</p>}
              </div>
            </div>
          </div>

          {/* Région et Centre - visible uniquement pour le ministère */}
          {!isAdminCentre && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Building className="w-5 h-5 mr-2 text-purple-600" />
                Localisation
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Région *
                  </label>
                  <select
                    name="region_id"
                    value={formData.region_id}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.region_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Sélectionner une région</option>
                    {regions.map(region => (
                      <option key={region.id_region} value={region.id_region}>
                        {region.nom}
                      </option>
                    ))}
                  </select>
                  {errors.region_id && <p className="mt-1 text-sm text-red-600">{errors.region_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centre de santé *
                  </label>
                  <select
                    name="centre_id"
                    value={formData.centre_id}
                    onChange={handleInputChange}
                    disabled={!formData.region_id || centres.length === 0}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.centre_id ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                  {errors.centre_id && <p className="mt-1 text-sm text-red-600">{errors.centre_id}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Informations médicales */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-purple-600" />
              Informations médicales
            </h2>

            {/* Allergies */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={allergieInput}
                  onChange={(e) => setAllergieInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('allergies', allergieInput, setAllergieInput);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ajouter une allergie"
                />
                <button
                  type="button"
                  onClick={() => addItem('allergies', allergieInput, setAllergieInput)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergie, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {allergie}
                    <button
                      type="button"
                      onClick={() => removeItem('allergies', index)}
                      className="ml-2 hover:text-red-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Antécédents */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antécédents médicaux
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={antecedentInput}
                  onChange={(e) => setAntecedentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('antecedents', antecedentInput, setAntecedentInput);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ajouter un antécédent"
                />
                <button
                  type="button"
                  onClick={() => addItem('antecedents', antecedentInput, setAntecedentInput)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.antecedents.map((antecedent, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {antecedent}
                    <button
                      type="button"
                      onClick={() => removeItem('antecedents', index)}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Maladies chroniques */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maladies chroniques
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={maladieInput}
                  onChange={(e) => setMaladieInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('maladies_chroniques', maladieInput, setMaladieInput);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ajouter une maladie chronique"
                />
                <button
                  type="button"
                  onClick={() => addItem('maladies_chroniques', maladieInput, setMaladieInput)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.maladies_chroniques.map((maladie, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                  >
                    {maladie}
                    <button
                      type="button"
                      onClick={() => removeItem('maladies_chroniques', index)}
                      className="ml-2 hover:text-yellow-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                if (returnTab) {
                  navigate(returnPath, { state: { activeTab: returnTab } });
                } else {
                  navigate(returnPath);
                }
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientFormNew;
