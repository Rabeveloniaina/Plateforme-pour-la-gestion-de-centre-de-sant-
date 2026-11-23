import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Syringe, Calendar, User, AlertCircle, CheckCircle, ArrowLeft, Save, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../lib/api';
import { apiFetch } from '../utils/apiFetch';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
}

interface VaccinFormData {
  id_patient: number;
  nom_vaccin: string;
  date_vaccination: string;
  dose: string;
  lot: string;
  site_injection: string;
  prochaine_dose: string;
  notes: string;
}

const VaccinationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<VaccinFormData>({
    id_patient: 0,
    nom_vaccin: '',
    date_vaccination: new Date().toISOString().split('T')[0],
    dose: '1',
    lot: '',
    site_injection: 'bras_gauche',
    prochaine_dose: '',
    notes: ''
  });

  useEffect(() => {
    fetchPatients();
    if (isEdit) {
      fetchVaccination();
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

  const fetchVaccination = async () => {
    try {
      const response = await apiFetch(`/vaccinations/${id}`);

      if (response.ok) {
        const data = await response.json();
        setFormData({
          id_patient: data.data.id_patient,
          nom_vaccin: data.data.nom_vaccin,
          date_vaccination: data.data.date_vaccination.split('T')[0],
          dose: data.data.dose,
          lot: data.data.lot,
          site_injection: data.data.site_injection,
          prochaine_dose: data.data.prochaine_dose ? data.data.prochaine_dose.split('T')[0] : '',
          notes: data.data.notes || ''
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement vaccination:', error);
      const errorMsg = error instanceof ApiError ? error.getMessage() : 'Erreur lors du chargement de la vaccination';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEdit 
        ? `/vaccinations/${id}`
        : '/vaccinations';

      const response = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success || response.ok) {
        showToast(`Vaccination ${isEdit ? 'modifiée' : 'enregistrée'} avec succès`, 'success');
        setTimeout(() => {
          navigate('/vaccinations');
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

  const vaccins = [
    'BCG',
    'Hépatite B',
    'DTC (Diphtérie-Tétanos-Coqueluche)',
    'Polio',
    'Haemophilus influenzae b',
    'Pneumocoque',
    'Rotavirus',
    'ROR (Rougeole-Oreillons-Rubéole)',
    'Varicelle',
    'HPV',
    'Méningocoque',
    'Grippe',
    'COVID-19',
    'Autre'
  ];

  const sitesInjection = [
    { value: 'bras_gauche', label: 'Bras gauche' },
    { value: 'bras_droit', label: 'Bras droit' },
    { value: 'cuisse_gauche', label: 'Cuisse gauche' },
    { value: 'cuisse_droite', label: 'Cuisse droite' },
    { value: 'fesse_gauche', label: 'Fesse gauche' },
    { value: 'fesse_droite', label: 'Fesse droite' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to="/vaccinations" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux vaccinations
          </Link>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Syringe className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Modifier la vaccination' : 'Nouvelle vaccination'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEdit ? 'Modifier les informations de la vaccination' : 'Enregistrer une nouvelle vaccination'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {isEdit ? 'Vaccination modifiée avec succès !' : 'Vaccination enregistrée avec succès !'}
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Patient *
              </label>
              <select
                required
                value={formData.id_patient}
                onChange={(e) => setFormData({ ...formData, id_patient: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isEdit}
              >
                <option value={0}>Sélectionner un patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.nom} {patient.prenom} - {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            </div>

            {/* Nom du vaccin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Syringe className="w-4 h-4 inline mr-2" />
                Vaccin *
              </label>
              <select
                required
                value={formData.nom_vaccin}
                onChange={(e) => setFormData({ ...formData, nom_vaccin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Sélectionner un vaccin</option>
                {vaccins.map((vaccin) => (
                  <option key={vaccin} value={vaccin}>
                    {vaccin}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date de vaccination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de vaccination *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_vaccination}
                  onChange={(e) => setFormData({ ...formData, date_vaccination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Dose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dose *
                </label>
                <input
                  type="text"
                  required
                  value={formData.dose}
                  onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                  placeholder="Ex: 1, 2, rappel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Numéro de lot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de lot *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lot}
                  onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                  placeholder="Ex: LOT12345"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Site d'injection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site d'injection *
                </label>
                <select
                  required
                  value={formData.site_injection}
                  onChange={(e) => setFormData({ ...formData, site_injection: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {sitesInjection.map((site) => (
                    <option key={site.value} value={site.value}>
                      {site.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prochaine dose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date de la prochaine dose (optionnel)
              </label>
              <input
                type="date"
                value={formData.prochaine_dose}
                onChange={(e) => setFormData({ ...formData, prochaine_dose: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes et observations
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Réactions, effets secondaires, observations..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/vaccinations')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Annuler</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default VaccinationForm;

