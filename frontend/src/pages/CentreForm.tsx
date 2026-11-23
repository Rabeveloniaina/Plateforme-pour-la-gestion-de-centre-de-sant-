import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  AlertTriangle
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/apiFetch';

interface CentreFormData {
  nom: string;
  adresse: string;
  region_id: number | '';
  capacite_max: number | '';
  telephone: string;
  email: string;
  mot_de_passe_admin: string;
  type_centre: 'poste_sante' | 'centre_sante' | 'hopital' | 'clinique';
  statut: 'actif' | 'inactif' | 'maintenance';
}

interface Region {
  id_region: number;
  nom: string;
  code_region: string;
}

const CentreForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<CentreFormData>({
		nom: '',
		adresse: '',
		region_id: '',
		capacite_max: '',
		telephone: '',
		email: '',
		mot_de_passe_admin: '',
		type_centre: 'centre_sante',
		statut: 'actif'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);

	useEffect(() => {
    fetchRegions();
    if (isEdit) {
      fetchCentreData();
    }
  }, [id, isEdit]);

  const fetchRegions = async () => {
    try {
      const response = await apiFetch('/regions');
      const data = await response.json();
      if (data.success) {
        setRegions(data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des régions:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  const fetchCentreData = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/centres/${id}`);
      const data = await response.json();
      if (data.success && data.data) {
        setFormData({
          nom: data.data.nom || '',
          adresse: data.data.adresse || '',
          region_id: data.data.region_id || '',
          capacite_max: data.data.capacite_max || '',
          telephone: data.data.telephone || '',
          email: data.data.email || '',
          mot_de_passe_admin: '',
          type_centre: data.data.type_centre || 'centre_sante',
          statut: data.data.statut || 'actif'
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du centre:', error);
      setErrors({ general: 'Erreur lors du chargement des données' });
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


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du centre est requis';
    }
    if (!formData.adresse.trim()) {
      newErrors.adresse = 'L\'adresse est requise';
    }
    if (!formData.region_id) {
      newErrors.region_id = 'La région est requise';
    }
    if (!formData.capacite_max) {
      newErrors.capacite_max = 'La capacité maximale est requise';
    }
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }
    if (!isEdit && !formData.mot_de_passe_admin.trim()) {
      newErrors.mot_de_passe_admin = 'Le mot de passe administrateur est requis';
    }

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
      const url = isEdit 
        ? `/centres/${id}` 
        : '/centres';

      const payload = { ...formData };
      if (isEdit) {
        delete payload.mot_de_passe_admin;
      }

      const response = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.success) {
        showToast(`Centre ${isEdit ? 'modifié' : 'enregistré'} avec succès`, 'success');
        navigate('/centres');
      } else {
        const errorMessage = data.message || 'Erreur lors de la sauvegarde';
        setErrors({ general: errorMessage });
        showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error.message || 'Erreur lors de la sauvegarde du centre';
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

	return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
      {/* Header Modern */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-6">
              <Link
                to="/centres"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Retour</span>
              </Link>
								<div className="h-8 w-px bg-gray-300"></div>
								<div>
                <h1 className="text-2xl font-bold text-gray-900">
										{isEdit ? 'Modifier le centre' : 'Nouveau centre'}
									</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isEdit ? 'Modifiez les informations du centre' : 'Créez un nouveau centre de santé'}
									</p>
								</div>
					</div>
				</div>
      </header>

      {/* Message d'erreur général */}
      {errors.general && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-l-4 border-rose-500 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-900">{errors.general}</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du centre <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											name="nom"
											value={formData.nom}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nom ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Centre de Santé Paris 1"
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
                {errors.adresse && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.adresse}
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
                  placeholder="+33 1 23 45 67 89"
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="contact@centre-paris1.fr"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
									</div>

              {!isEdit && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe administrateur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mot_de_passe_admin"
                    value={formData.mot_de_passe_admin}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.mot_de_passe_admin ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Définir un mot de passe pour l'administrateur du centre"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce mot de passe sera utilisé pour le compte administrateur centre (login = email saisi).
                  </p>
                  {errors.mot_de_passe_admin && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.mot_de_passe_admin}
                    </p>
                  )}
                </div>
              )}
              
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
                  Région <span className="text-red-500">*</span>
										</label>
                <select
                  name="region_id"
                  value={formData.region_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.region_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loadingRegions}
                >
                  <option value="">Sélectionner une région</option>
                  {regions.map(region => (
                    <option key={region.id_region} value={region.id_region}>
                      {region.nom}
                    </option>
                  ))}
                </select>
                {errors.region_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.region_id}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité maximale <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacite_max"
                  value={formData.capacite_max}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.capacite_max ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="100"
                  min="1"
                />
                {errors.capacite_max && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.capacite_max}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de centre</label>
										<select
											name="type_centre"
											value={formData.type_centre}
                  onChange={handleInputChange}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="poste_sante">Poste de santé</option>
											<option value="centre_sante">Centre de santé</option>
											<option value="hopital">Hôpital</option>
											<option value="clinique">Clinique</option>
										</select>
              </div>
              
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
											<option value="maintenance">Maintenance</option>
										</select>
									</div>
									</div>
								</div>

          {/* Affichage des erreurs générales */}
          {errors.general && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-red-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {errors.general}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Link
              to="/centres"
              className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 font-medium"
            >
              Annuler
            </Link>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" strokeWidth={2} />
                  <span>{isEdit ? 'Enregistrer' : 'Créer le centre'}</span>
                </>
              )}
            </motion.button>
          </div>
						</form>
					</div>
				</div>
  );
};

export default CentreForm;