import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/apiFetch';
import { motion } from 'framer-motion';
import { User, MapPin, Calendar, Phone, Mail, AlertCircle } from 'lucide-react';

interface Region {
  id_region: number;
  nom: string;
}

interface Centre {
  id_centre: number;
  nom: string;
  adresse: string;
}

const CompletePatientProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: '',
    telephone: '',
    email: '',
    adresse: '',
    region_id: '',
    centre_id: ''
  });
  
  const [regions, setRegions] = useState<Region[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRegions();
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, []);

  useEffect(() => {
    if (formData.region_id) {
      fetchCentresByRegion(Number(formData.region_id));
    } else {
      setCentres([]);
      setFormData(prev => ({ ...prev, centre_id: '' }));
    }
  }, [formData.region_id]);

  const fetchRegions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch('/regions', {}, !token);
      if (response.ok) {
        const data = await response.json();
        setRegions(data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des régions:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCentresByRegion = async (regionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`/regions/${regionId}/centres`, {}, !token);
      if (response.ok) {
        const data = await response.json();
        setCentres(data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des centres:', error);
      setCentres([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
    // Prénom est optionnel pour les malgaches
    if (!formData.date_naissance) newErrors.date_naissance = 'La date de naissance est requise';
    if (!formData.sexe) newErrors.sexe = 'Le sexe est requis';
    if (!formData.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!formData.adresse.trim()) newErrors.adresse = 'L\'adresse est requise';
    if (!formData.region_id) newErrors.region_id = 'La région est requise';
    if (!formData.centre_id) newErrors.centre_id = 'Le centre de santé est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Veuillez remplir tous les champs requis', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/patients/me', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Profil patient créé avec succès !', 'success');
        setTimeout(() => {
          navigate('/patient/book-appointment');
        }, 1500);
      } else {
        const errorMessage = data.message || 'Erreur lors de la création du profil';
        setErrors({ general: errorMessage });
        showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      const errorMessage = error.message || 'Erreur lors de la création du profil';
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compléter votre profil patient</h1>
              <p className="text-gray-600 mt-1">Pour prendre un rendez-vous, vous devez compléter votre profil</p>
            </div>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.prenom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date de naissance *
                </label>
                <input
                  type="date"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.date_naissance ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.date_naissance && <p className="text-red-500 text-sm mt-1">{errors.date_naissance}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe *
                </label>
                <select
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.sexe ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                {errors.sexe && <p className="text-red-500 text-sm mt-1">{errors.sexe}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.telephone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.telephone && <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Adresse *
              </label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.adresse ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.adresse && <p className="text-red-500 text-sm mt-1">{errors.adresse}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Région *
                </label>
                <select
                  name="region_id"
                  value={formData.region_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.region_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Sélectionner une région</option>
                  {regions.map((region) => (
                    <option key={region.id_region} value={region.id_region}>
                      {region.nom}
                    </option>
                  ))}
                </select>
                {errors.region_id && <p className="text-red-500 text-sm mt-1">{errors.region_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centre de santé *
                </label>
                <select
                  name="centre_id"
                  value={formData.centre_id}
                  onChange={handleChange}
                  disabled={!formData.region_id}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.centre_id ? 'border-red-500' : 'border-gray-300'
                  } ${!formData.region_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                >
                  <option value="">
                    {formData.region_id ? 'Sélectionner un centre' : 'Sélectionnez d\'abord une région'}
                  </option>
                  {centres.map((centre) => (
                    <option key={centre.id_centre} value={centre.id_centre}>
                      {centre.nom}
                    </option>
                  ))}
                </select>
                {errors.centre_id && <p className="text-red-500 text-sm mt-1">{errors.centre_id}</p>}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création en cours...' : 'Créer mon profil'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/patient/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CompletePatientProfile;

