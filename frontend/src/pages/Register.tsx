import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, Mail, Phone, Calendar, MapPin, Building, UserPlus } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

interface Centre {
  id_centre: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  region_id: number;
  nom_region: string;
  code_region: string;
}

interface Region {
  id_region: number;
  nom: string;
  code_region: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: '',
    adresse: '',
    telephone: '',
    email: '',
    mot_de_passe: '',
    confirm_password: '',
    region_id: '',
    centre_id: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [centres, setCentres] = useState<Centre[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fonction pour filtrer les centres par région
  const getFilteredCentres = () => {
    const filteredCentres = centres.filter(centre =>
      !formData.region_id || centre.region_id === parseInt(formData.region_id)
    );

    // Supprimer les doublons basés sur l'id_centre
    return filteredCentres.filter((centre, index, self) =>
      index === self.findIndex(c => c.id_centre === centre.id_centre)
    );
  };

  // Charger les centres et régions disponibles
  useEffect(() => {
    const loadData = async () => {
      try {
        const [centresRes, regionsRes] = await Promise.all([
          apiFetch('/registration/centres', {}, true), // Public endpoint
          apiFetch('/registration/regions', {}, true)  // Public endpoint
        ]);

        if (centresRes.ok) {
          const centresData = await centresRes.json();
          console.log('Centres chargés:', centresData.data);
          setCentres(centresData.data || []);
        }

        if (regionsRes.ok) {
          const regionsData = await regionsRes.json();
          console.log('Régions chargées:', regionsData.data);
          setRegions(regionsData.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des centres et régions');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Si la région change, réinitialiser la sélection du centre
    if (name === 'region_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        centre_id: '' // Réinitialiser la sélection du centre
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    console.log('🔍 Validation du formulaire:', formData);

    // Prénom est optionnel pour les malgaches
    if (!formData.nom || !formData.date_naissance || !formData.sexe ||
      !formData.adresse || !formData.telephone || !formData.email || !formData.mot_de_passe ||
      !formData.region_id || !formData.centre_id) {
      console.log('❌ Validation échouée: champs manquants');
      setError('Veuillez remplir tous les champs obligatoires. Note: Le prénom est optionnel.');
      return false;
    }

    console.log('✅ Validation réussie');

    if (formData.mot_de_passe !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (formData.mot_de_passe.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestData = {
        nom: formData.nom,
        prenom: formData.prenom,
        date_naissance: formData.date_naissance,
        sexe: formData.sexe,
        adresse: formData.adresse,
        telephone: formData.telephone,
        email: formData.email,
        mot_de_passe: formData.mot_de_passe,
        region_id: formData.region_id,
        centre_id: formData.centre_id
      };

      console.log('🔍 Données envoyées au serveur:', requestData);

      const response = await apiFetch('/registration/patient', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('📊 Réponse du serveur:', response.status, response.statusText);

      const data = await response.json();

      if (data.success) {
        setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Gestion spécifique des erreurs
        if (response.status === 409) {
          setError('Un compte avec cet email existe déjà. Veuillez utiliser un autre email ou vous connecter.');
        } else if (response.status === 400) {
          setError(data.message || 'Données invalides. Vérifiez vos informations.');
        } else {
          setError(data.message || 'Erreur lors de la création du compte');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des centres de santé...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Créer un compte patient
            </h1>
            <p className="text-gray-600">
              Inscrivez-vous pour accéder aux services de santé
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom */}
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    value={formData.nom}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              {/* Prénom */}
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-xs text-gray-500">(optionnel)</span>
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Votre prénom (optionnel)"
                />
              </div>

              {/* Date de naissance */}
              <div>
                <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="date_naissance"
                    name="date_naissance"
                    type="date"
                    value={formData.date_naissance}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Sexe */}
              <div>
                <label htmlFor="sexe" className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe *
                </label>
                <select
                  id="sexe"
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Sélectionnez votre sexe</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0201234567"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="adresse"
                  name="adresse"
                  type="text"
                  value={formData.adresse}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Votre adresse complète"
                  required
                />
              </div>
            </div>

            {/* Région */}
            <div>
              <label htmlFor="region_id" className="block text-sm font-medium text-gray-700 mb-2">
                Région *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="region_id"
                  name="region_id"
                  value={formData.region_id}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Sélectionnez votre région</option>
                  {regions.map((region) => (
                    <option key={region.id_region} value={region.id_region}>
                      {region.nom} ({region.code_region})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Centre de santé */}
            <div>
              <label htmlFor="centre_id" className="block text-sm font-medium text-gray-700 mb-2">
                Centre de santé de base *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="centre_id"
                  name="centre_id"
                  value={formData.centre_id}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Sélectionnez votre centre de santé de base</option>
                  {getFilteredCentres().map((centre) => (
                    <option key={centre.id_centre} value={centre.id_centre}>
                      {centre.nom} - {centre.nom_region}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Vous pourrez changer de centre lors de la prise de rendez-vous.
              </p>
            </div>

            {/* Mot de passe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="mot_de_passe" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="mot_de_passe"
                    name="mot_de_passe"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Confirmer le mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Messages d'erreur et de succès */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
              >
                <div className="flex justify-between items-start">
                  <span>{error}</span>
                  {error.includes('existe déjà') && (
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setFormData(prev => ({ ...prev, email: '' }));
                      }}
                      className="ml-2 text-red-800 hover:text-red-900 underline text-xs"
                    >
                      Changer l'email
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm"
              >
                {success}
              </motion.div>
            )}

            {/* Bouton d'inscription */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Création du compte...
                </div>
              ) : (
                'Créer mon compte'
              )}
            </motion.button>
          </form>

          {/* Lien de connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
