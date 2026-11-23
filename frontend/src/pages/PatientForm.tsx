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
  Building2
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface PatientFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: string;
  telephone: string;
  email: string;
  adresse: string;
  centre_id: number;
  groupe_sanguin: string;
  allergies: string[];
  maladies_chroniques: string[];
  notes_medicales: string;
}

interface Centre {
  id_centre: number;
  nom: string;
  adresse: string;
  region_nom?: string;
}

const PatientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { handleError, fieldErrors, clearError } = useErrorHandler();
  
  const [formData, setFormData] = useState<PatientFormData>({
		nom: '',
		prenom: '',
		date_naissance: '',
		sexe: 'M',
		telephone: '',
		email: '',
		adresse: '',
    centre_id: 0,
		groupe_sanguin: '',
    allergies: [],
    maladies_chroniques: [],
    notes_medicales: ''
  });
  
  const [centres, setCentres] = useState<Centre[]>([]);
  const [userCentre, setUserCentre] = useState<Centre | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allergieInput, setAllergieInput] = useState('');
  const [maladieInput, setMaladieInput] = useState('');
  
  // Déterminer si l'utilisateur est admin_centre ou similaire
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
      fetchPatientData();
    }
  }, [id, isEdit, isAdminCentre]);

  const fetchUserCentre = async () => {
    try {
      if (user?.id_centre) {
        const data = await api.get<Centre>(`/centres/${user.id_centre}`);
        setUserCentre(data);
        setFormData(prev => ({ ...prev, centre_id: data.id_centre }));
        console.log('✅ Centre de l\'utilisateur chargé:', data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du centre:', error);
    }
  };

  const fetchCentres = async () => {
    try {
      const data = await api.get<Centre[]>('/centres');
      setCentres(data);
    } catch (error) {
      console.error('Erreur lors du chargement des centres:', error);
    }
  };

  const fetchPatientData = async () => {
    try {
      const data = await api.get<PatientFormData>(`/patients/${id}`);
      setFormData(data as any);
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
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddAllergie = () => {
    if (allergieInput.trim() && !formData.allergies.includes(allergieInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergieInput.trim()]
      }));
      setAllergieInput('');
    }
  };

  const handleRemoveAllergie = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleAddMaladie = () => {
    if (maladieInput.trim() && !formData.maladies_chroniques.includes(maladieInput.trim())) {
      setFormData(prev => ({
        ...prev,
        maladies_chroniques: [...prev.maladies_chroniques, maladieInput.trim()]
      }));
      setMaladieInput('');
    }
  };

  const handleRemoveMaladie = (index: number) => {
    setFormData(prev => ({
      ...prev,
      maladies_chroniques: prev.maladies_chroniques.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires selon la DB
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    if (!formData.date_naissance) {
      newErrors.date_naissance = 'La date de naissance est requise';
    }
    if (!formData.sexe) {
      newErrors.sexe = 'Le sexe est requis';
    }
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    }
    if (!formData.adresse.trim()) {
      newErrors.adresse = 'L\'adresse est requise';
    }
    
    // Email optionnel mais si renseigné, doit être valide
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Centre requis SEULEMENT pour le ministère (pour admin_centre c'est auto-assigné)
    if (!isAdminCentre && !formData.centre_id) {
      newErrors.centre_id = 'Le centre est requis';
    }
    
    // Groupe sanguin OPTIONNEL - peut être inconnu

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

	const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Réinitialiser les erreurs
    clearError(); // Effacer les erreurs précédentes
    
		try {
			if (isEdit) {
        await api.put(`/patients/${id}`, formData);
			} else {
        await api.post('/patients', formData);
      }
      
      // Succès
      showToast(`Patient ${isEdit ? 'modifié' : 'enregistré'} avec succès`, 'success');
      navigate('/patients');
    } catch (error: any) {
      // Utiliser useErrorHandler pour gérer l'erreur
      const result = await handleError(error);
      
      // Si erreurs de validation, les ajouter aux erreurs du formulaire
      if (result.hasFieldErrors) {
        setErrors(result.fieldErrors);
      } else {
        setErrors({ general: result.message });
      }
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
              <Link
                to="/patients"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </Link>
								<div>
                <h1 className="text-2xl font-bold text-gray-900">
										{isEdit ? 'Modifier le patient' : 'Nouveau patient'}
									</h1>
                <p className="text-gray-600">
                  {isEdit ? 'Modifiez les informations du patient' : 'Créez un nouveau patient'}
									</p>
								</div>
							</div>
					</div>
				</div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations personnelles */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-blue-600" />
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nom ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Entrez le nom"
                />
                {(errors.nom || fieldErrors.nom) && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.nom || fieldErrors.nom}
                  </p>
                )}
									</div>
              
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											name="prenom"
											value={formData.prenom}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.prenom ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Entrez le prénom"
                />
                {(errors.prenom || fieldErrors.prenom) && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.prenom || fieldErrors.prenom}
                  </p>
                )}
									</div>
              
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance <span className="text-red-500">*</span>
										</label>
										<input
											type="date"
											name="date_naissance"
											value={formData.date_naissance}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.date_naissance ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {(errors.date_naissance || fieldErrors.date_naissance) && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.date_naissance || fieldErrors.date_naissance}
                  </p>
                )}
								</div>
              
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe <span className="text-red-500">*</span>
										</label>
										<select
											name="sexe"
											value={formData.sexe}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.sexe ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                {(errors.sexe || fieldErrors.sexe) && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.sexe || fieldErrors.sexe}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.telephone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+33 6 12 34 56 78"
                />
                {(errors.telephone || fieldErrors.telephone) && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.telephone || fieldErrors.telephone}
                  </p>
                )}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="jean.dupont@email.com"
                />
                {(errors.email || fieldErrors.email) && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.email || fieldErrors.email}
                  </p>
                )}
									</div>
              
              <div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse <span className="text-red-500">*</span>
										</label>
                <input
                  type="text"
											name="adresse"
											value={formData.adresse}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.adresse ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                />
                {(errors.adresse || fieldErrors.adresse) && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.adresse || fieldErrors.adresse}
                  </p>
                )}
              </div>
									</div>
								</div>

							{/* Informations médicales */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Heart className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Informations médicales</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.centre_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value={0}>Sélectionner un centre</option>
                    {centres.map((centre) => (
                      <option key={centre.id_centre} value={centre.id_centre}>
                        {centre.nom} {centre.region_nom ? `(${centre.region_nom})` : ''}
                      </option>
                    ))}
                  </select>
                  {(errors.centre_id || fieldErrors.centre_id) && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.centre_id || fieldErrors.centre_id}
                    </p>
                  )}
                </div>
              )}
              
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
                  Groupe sanguin <span className="text-xs text-gray-500">(optionnel, peut être renseigné plus tard)</span>
										</label>
										<select
											name="groupe_sanguin"
											value={formData.groupe_sanguin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Allergies */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={allergieInput}
                  onChange={(e) => setAllergieInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ajouter une allergie"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergie())}
                />
                <button
                  type="button"
                  onClick={handleAddAllergie}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergie, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                  >
                    {allergie}
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergie(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
									</div>

            {/* Maladies chroniques */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Maladies chroniques</label>
              <div className="flex space-x-2 mb-2">
										<input
											type="text"
                  value={maladieInput}
                  onChange={(e) => setMaladieInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ajouter une maladie chronique"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMaladie())}
                />
                <button
                  type="button"
                  onClick={handleAddMaladie}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.maladies_chroniques.map((maladie, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                  >
                    {maladie}
                    <button
                      type="button"
                      onClick={() => handleRemoveMaladie(index)}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
									</div>

            {/* Notes médicales */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes médicales</label>
										<textarea
                name="notes_medicales"
                value={formData.notes_medicales}
                onChange={handleInputChange}
                rows={4}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notes médicales du patient..."
										/>
									</div>
								</div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/patients"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </Link>
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

export default PatientForm;