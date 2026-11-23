import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Activity, Droplet, Scale, Ruler, AlertCircle, FileText, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiFetch';

interface MedicalRecord {
  id_info?: number;
  patient_id: number;
  groupe_sanguin: string;
  poids: string;
  taille: string;
  tension: string;
  allergies: string;
  antecedents: string;
  maladies_chroniques: string;
  medicaments_actuels: string;
  contacts_urgence: string;
}

const MedicalRecordForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<MedicalRecord>({
    patient_id: user?.id || 0,
    groupe_sanguin: '',
    poids: '',
    taille: '',
    tension: '',
    allergies: '',
    antecedents: '',
    maladies_chroniques: '',
    medicaments_actuels: '',
    contacts_urgence: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Charger la fiche médicale existante si elle existe
  useEffect(() => {
    fetchExistingRecord();
  }, []);

  const fetchExistingRecord = async () => {
    try {
      const response = await apiFetch('/fiches-medicales/me');

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setFormData({
            ...data.data,
            poids: data.data.poids || '',
            taille: data.data.taille || '',
            tension: data.data.tension || '',
            allergies: data.data.allergies || '',
            antecedents: data.data.antecedents || '',
            maladies_chroniques: data.data.maladies_chroniques || '',
            medicaments_actuels: data.data.medicaments_actuels || '',
            contacts_urgence: data.data.contacts_urgence || ''
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la fiche médicale:', error);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Préparer les données avec infos_complementaires en JSON
      const recordData = {
        groupe_sanguin: formData.groupe_sanguin || null,
        poids: formData.poids ? parseFloat(formData.poids) : null,
        taille: formData.taille ? parseFloat(formData.taille) : null,
        tension: formData.tension || '',
        allergies: formData.allergies || '',
        antecedents: formData.antecedents || '',
        infos_complementaires: {
          maladies_chroniques: formData.maladies_chroniques || '',
          medicaments_actuels: formData.medicaments_actuels || '',
          contacts_urgence: formData.contacts_urgence || ''
        }
      };

      const url = formData.id_info 
        ? `/fiches-medicales/${formData.id_info}`
        : '/fiches-medicales';

      const response = await apiFetch(url, {
        method: formData.id_info ? 'PUT' : 'POST',
        body: JSON.stringify(recordData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(formData.id_fiche 
          ? 'Fiche médicale mise à jour avec succès !' 
          : 'Fiche médicale créée avec succès !');
        
        setTimeout(() => {
          navigate('/patient/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de l\'enregistrement de la fiche médicale');
    } finally {
      setLoading(false);
    }
  };

  if (loadingExisting) {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au dashboard
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {formData.id_info ? 'Modifier ma fiche médicale' : 'Créer ma fiche médicale'}
              </h1>
              <p className="text-gray-600 mt-1">
                Renseignez vos informations médicales pour un meilleur suivi
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start"
          >
            <AlertCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              Informations de base
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Groupe sanguin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplet className="w-4 h-4 inline mr-1" />
                  Groupe sanguin
                </label>
                <select
                  name="groupe_sanguin"
                  value={formData.groupe_sanguin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Sélectionner</option>
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

              {/* Poids */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Poids (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="poids"
                  value={formData.poids}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: 70.5"
                />
              </div>

              {/* Taille */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  Taille (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="taille"
                  value={formData.taille}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: 175"
                />
              </div>

              {/* Tension */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Heart className="w-4 h-4 inline mr-1" />
                  Tension artérielle
                </label>
                <input
                  type="text"
                  name="tension"
                  value={formData.tension}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: 120/80"
                />
              </div>
            </div>
          </motion.div>

          {/* Historique médical */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Historique médical
            </h2>

            <div className="space-y-4">
              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-red-500" />
                  Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Pénicilline, Arachides, Pollen..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Listez toutes vos allergies connues (médicaments, aliments, autres)
                </p>
              </div>

              {/* Antécédents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antécédents médicaux
                </label>
                <textarea
                  name="antecedents"
                  value={formData.antecedents}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Hypertension familiale, Diabète, Chirurgies passées..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maladies ou interventions importantes dans votre famille ou votre passé
                </p>
              </div>

              {/* Maladies chroniques */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maladies chroniques actuelles
                </label>
                <textarea
                  name="maladies_chroniques"
                  value={formData.maladies_chroniques}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Diabète type 2, Asthme, Hypertension..."
                />
              </div>

              {/* Médicaments actuels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médicaments actuels
                </label>
                <textarea
                  name="medicaments_actuels"
                  value={formData.medicaments_actuels}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Metformine 500mg (2x/jour), Ventoline (si besoin)..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Listez tous vos traitements en cours avec les dosages
                </p>
              </div>

              {/* Contacts d'urgence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacts d'urgence
                </label>
                <textarea
                  name="contacts_urgence"
                  value={formData.contacts_urgence}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Marie Dupont (sœur) - 0123456789"
                />
              </div>
            </div>
          </motion.div>

          {/* Boutons d'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end space-x-4"
          >
            <button
              type="button"
              onClick={() => navigate('/patient/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {formData.id_info ? 'Mettre à jour' : 'Créer ma fiche médicale'}
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default MedicalRecordForm;

