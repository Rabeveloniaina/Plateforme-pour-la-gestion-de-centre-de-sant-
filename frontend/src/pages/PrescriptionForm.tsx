import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clipboard, AlertCircle, CheckCircle, ArrowLeft, Save, X, Plus, Trash2, User, Pill } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../lib/api';
import { apiFetch } from '../utils/apiFetch';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
}

interface Medicament {
  id_medicament: number;
  nom_commercial: string;
  nom_generique: string;
  forme: string;
  dosage: string;
}

interface MedicamentPrescrit {
  id_medicament: number;
  nom_medicament: string;
  dosage: string;
  frequence: string;
  duree_traitement: string;
  instructions: string;
}

interface PrescriptionFormData {
  id_patient: number;
  id_fiche_medicale?: number;
  date_debut: string;
  date_fin: string;
  instructions_generales: string;
  medicaments: MedicamentPrescrit[];
}

const PrescriptionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<PrescriptionFormData>({
    id_patient: 0,
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    instructions_generales: '',
    medicaments: []
  });

  useEffect(() => {
    fetchPatients();
    fetchMedicaments();
    if (isEdit) {
      fetchPrescription();
    }
  }, [id]);

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

  const fetchMedicaments = async () => {
    try {
      const response = await apiFetch('/medicaments');
      if (response.ok) {
        const data = await response.json();
        setMedicaments(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement médicaments:', error);
    }
  };

  const fetchPrescription = async () => {
    try {
      const response = await apiFetch(`/prescriptions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          id_patient: data.data.id_patient,
          id_fiche_medicale: data.data.id_fiche_medicale,
          date_debut: data.data.date_debut.split('T')[0],
          date_fin: data.data.date_fin ? data.data.date_fin.split('T')[0] : '',
          instructions_generales: data.data.instructions_generales || '',
          medicaments: data.data.medicaments || []
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement prescription:', error);
      const errorMsg = error instanceof ApiError ? error.getMessage() : 'Erreur lors du chargement de la prescription';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.medicaments.length === 0) {
      const errorMsg = 'Vous devez ajouter au moins un médicament';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = isEdit 
        ? `/prescriptions/${id}`
        : '/prescriptions';

      const response = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success || response.ok) {
        showToast(`Prescription ${isEdit ? 'modifiée' : 'créée'} avec succès`, 'success');
        setTimeout(() => {
          navigate('/prescriptions');
        }, 1500);
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

  const addMedicament = () => {
    setFormData({
      ...formData,
      medicaments: [
        ...formData.medicaments,
        {
          id_medicament: 0,
          nom_medicament: '',
          dosage: '',
          frequence: '3 fois par jour',
          duree_traitement: '7 jours',
          instructions: ''
        }
      ]
    });
  };

  const removeMedicament = (index: number) => {
    setFormData({
      ...formData,
      medicaments: formData.medicaments.filter((_, i) => i !== index)
    });
  };

  const updateMedicament = (index: number, field: keyof MedicamentPrescrit, value: any) => {
    const newMedicaments = [...formData.medicaments];
    newMedicaments[index] = {
      ...newMedicaments[index],
      [field]: value
    };

    // Si on change le médicament, mettre à jour le nom
    if (field === 'id_medicament') {
      const med = medicaments.find(m => m.id_medicament === parseInt(value));
      if (med) {
        newMedicaments[index].nom_medicament = med.nom_commercial;
        newMedicaments[index].dosage = med.dosage;
      }
    }

    setFormData({
      ...formData,
      medicaments: newMedicaments
    });
  };

  const frequences = [
    '1 fois par jour',
    '2 fois par jour',
    '3 fois par jour',
    '4 fois par jour',
    'Toutes les 4 heures',
    'Toutes les 6 heures',
    'Toutes les 8 heures',
    'Toutes les 12 heures',
    'Au besoin',
    'Avant les repas',
    'Après les repas',
    'Au coucher'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to="/prescriptions" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux prescriptions
          </Link>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clipboard className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Modifier la prescription' : 'Nouvelle prescription'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEdit ? 'Modifier les détails de la prescription' : 'Créer une nouvelle prescription médicale'}
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
                {isEdit ? 'Prescription modifiée avec succès !' : 'Prescription créée avec succès !'}
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
              <User className="w-5 h-5 mr-2 text-blue-600" />
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
                  onChange={(e) => setFormData({ ...formData, id_patient: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isEdit}
                >
                  <option value={0}>Sélectionner un patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.nom} {patient.prenom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin (optionnel)
                </label>
                <input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions générales
                </label>
                <textarea
                  value={formData.instructions_generales}
                  onChange={(e) => setFormData({ ...formData, instructions_generales: e.target.value })}
                  rows={3}
                  placeholder="Instructions générales pour le patient..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </motion.div>

          {/* Médicaments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-blue-600" />
                Médicaments prescrits
              </h2>
              <button
                type="button"
                onClick={addMedicament}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un médicament</span>
              </button>
            </div>

            {formData.medicaments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun médicament ajouté</p>
                <p className="text-sm mt-2">Cliquez sur "Ajouter un médicament" pour commencer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.medicaments.map((med, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Médicament {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeMedicament(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Médicament *
                        </label>
                        <select
                          required
                          value={med.id_medicament}
                          onChange={(e) => updateMedicament(index, 'id_medicament', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={0}>Sélectionner un médicament</option>
                          {medicaments.map((medicament) => (
                            <option key={medicament.id_medicament} value={medicament.id_medicament}>
                              {medicament.nom_commercial} ({medicament.nom_generique}) - {medicament.dosage}
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
                          value={med.dosage}
                          onChange={(e) => updateMedicament(index, 'dosage', e.target.value)}
                          placeholder="Ex: 1 comprimé, 10ml"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fréquence *
                        </label>
                        <select
                          required
                          value={med.frequence}
                          onChange={(e) => updateMedicament(index, 'frequence', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {frequences.map((freq) => (
                            <option key={freq} value={freq}>
                              {freq}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Durée du traitement *
                        </label>
                        <input
                          type="text"
                          required
                          value={med.duree_traitement}
                          onChange={(e) => updateMedicament(index, 'duree_traitement', e.target.value)}
                          placeholder="Ex: 7 jours, 2 semaines"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions spécifiques
                        </label>
                        <textarea
                          value={med.instructions}
                          onChange={(e) => updateMedicament(index, 'instructions', e.target.value)}
                          rows={2}
                          placeholder="Ex: À prendre pendant les repas..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/prescriptions')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
};

export default PrescriptionForm;

