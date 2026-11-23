import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pill, AlertCircle, CheckCircle, ArrowLeft, Save, X, Package } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

interface MedicamentFormData {
  nom_commercial: string;
  nom_generique: string;
  forme: string;
  dosage: string;
  fabricant: string;
  classe_therapeutique: string;
  indications: string;
  contre_indications: string;
  effets_secondaires: string;
  interactions: string;
  posologie_adulte: string;
  posologie_enfant: string;
  prix_unitaire: number;
  stock_disponible: number;
  seuil_alerte: number;
  prescription_requise: boolean;
  statut: 'actif' | 'inactif';
}

const MedicamentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<MedicamentFormData>({
    nom_commercial: '',
    nom_generique: '',
    forme: 'comprime',
    dosage: '',
    fabricant: '',
    classe_therapeutique: '',
    indications: '',
    contre_indications: '',
    effets_secondaires: '',
    interactions: '',
    posologie_adulte: '',
    posologie_enfant: '',
    prix_unitaire: 0,
    stock_disponible: 0,
    seuil_alerte: 10,
    prescription_requise: false,
    statut: 'actif'
  });

  useEffect(() => {
    if (isEdit) {
      fetchMedicament();
    }
  }, [id]);

  const fetchMedicament = async () => {
    try {
      const response = await apiFetch(`/medicaments/${id}`);

      if (response.ok) {
        const data = await response.json();
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement médicament:', error);
      setError('Erreur lors du chargement du médicament');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit 
        ? `/medicaments/${id}`
        : '/medicaments';

      const response = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/medicaments');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const formes = [
    'comprime',
    'gelule',
    'sirop',
    'suspension',
    'solution',
    'injection',
    'pommade',
    'creme',
    'gel',
    'suppositoire',
    'patch',
    'spray',
    'gouttes',
    'autre'
  ];

  const classes = [
    'Antibiotique',
    'Anti-inflammatoire',
    'Antalgique',
    'Antipyrétique',
    'Antihistaminique',
    'Antihypertenseur',
    'Antidiabétique',
    'Anticoagulant',
    'Bronchodilatateur',
    'Corticoïde',
    'Vitamine',
    'Supplément',
    'Autre'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to="/medicaments" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux médicaments
          </Link>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Pill className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Modifier le médicament' : 'Nouveau médicament'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEdit ? 'Modifier les informations du médicament' : 'Ajouter un nouveau médicament au catalogue'}
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
                {isEdit ? 'Médicament modifié avec succès !' : 'Médicament ajouté avec succès !'}
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Informations générales */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-green-600" />
                Informations générales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom commercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom_commercial}
                    onChange={(e) => setFormData({ ...formData, nom_commercial: e.target.value })}
                    placeholder="Ex: Doliprane"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom générique *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom_generique}
                    onChange={(e) => setFormData({ ...formData, nom_generique: e.target.value })}
                    placeholder="Ex: Paracétamol"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forme *
                  </label>
                  <select
                    required
                    value={formData.forme}
                    onChange={(e) => setFormData({ ...formData, forme: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {formes.map((forme) => (
                      <option key={forme} value={forme}>
                        {forme.charAt(0).toUpperCase() + forme.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="Ex: 500mg, 10ml"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fabricant *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fabricant}
                    onChange={(e) => setFormData({ ...formData, fabricant: e.target.value })}
                    placeholder="Ex: Sanofi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe thérapeutique *
                  </label>
                  <select
                    required
                    value={formData.classe_therapeutique}
                    onChange={(e) => setFormData({ ...formData, classe_therapeutique: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map((classe) => (
                      <option key={classe} value={classe}>
                        {classe}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Informations médicales */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Informations médicales
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indications
                  </label>
                  <textarea
                    value={formData.indications}
                    onChange={(e) => setFormData({ ...formData, indications: e.target.value })}
                    rows={3}
                    placeholder="Indications thérapeutiques..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contre-indications
                  </label>
                  <textarea
                    value={formData.contre_indications}
                    onChange={(e) => setFormData({ ...formData, contre_indications: e.target.value })}
                    rows={3}
                    placeholder="Contre-indications..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effets secondaires
                  </label>
                  <textarea
                    value={formData.effets_secondaires}
                    onChange={(e) => setFormData({ ...formData, effets_secondaires: e.target.value })}
                    rows={3}
                    placeholder="Effets secondaires possibles..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interactions médicamenteuses
                  </label>
                  <textarea
                    value={formData.interactions}
                    onChange={(e) => setFormData({ ...formData, interactions: e.target.value })}
                    rows={3}
                    placeholder="Interactions connues..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posologie adulte
                    </label>
                    <textarea
                      value={formData.posologie_adulte}
                      onChange={(e) => setFormData({ ...formData, posologie_adulte: e.target.value })}
                      rows={2}
                      placeholder="Ex: 1 comprimé 3 fois par jour"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posologie enfant
                    </label>
                    <textarea
                      value={formData.posologie_enfant}
                      onChange={(e) => setFormData({ ...formData, posologie_enfant: e.target.value })}
                      rows={2}
                      placeholder="Ex: 1/2 comprimé 2 fois par jour"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock et tarification */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-green-600" />
                Stock et tarification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix unitaire (Ar) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.prix_unitaire}
                    onChange={(e) => setFormData({ ...formData, prix_unitaire: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock disponible *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock_disponible}
                    onChange={(e) => setFormData({ ...formData, stock_disponible: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seuil d'alerte *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.seuil_alerte}
                    onChange={(e) => setFormData({ ...formData, seuil_alerte: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Paramètres */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Paramètres
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="prescription_requise"
                    checked={formData.prescription_requise}
                    onChange={(e) => setFormData({ ...formData, prescription_requise: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="prescription_requise" className="text-sm font-medium text-gray-700">
                    Prescription médicale requise
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'actif' | 'inactif' })}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/medicaments')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Annuler</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </motion.div>
      </div>
    </div>
  );
};

export default MedicamentForm;

