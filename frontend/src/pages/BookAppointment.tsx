import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Building, User, Phone, Mail, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiFetch';

interface Centre {
  id_centre: number;
  nom_centre: string;
  adresse: string;
  telephone: string;
  email: string;
  nom_region: string;
  code_region: string;
}

interface Medecin {
  id_medecin: number;
  nom: string;
  prenom: string;
  specialite: string;
  telephone: string;
  email: string;
  centre_id: number;
}

const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    centre_id: '',
    medecin_id: '',
    date_rdv: '',
    heure_rdv: '',
    motif: '',
    notes: ''
  });
  const [centres, setCentres] = useState<Centre[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Charger les centres disponibles
  useEffect(() => {
    const loadCentres = async () => {
      try {
        const response = await apiFetch('/registration/centres', {}, true); // Public endpoint
        if (response.ok) {
          const data = await response.json();
          setCentres(data.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des centres:', error);
        setError('Erreur lors du chargement des centres');
      } finally {
        setLoadingData(false);
      }
    };

    loadCentres();
  }, []);

  // Charger les médecins du centre sélectionné
  useEffect(() => {
    const loadMedecins = async () => {
      if (!formData.centre_id) {
        setMedecins([]);
        return;
      }

      try {
        const response = await apiFetch(`/medecins/centre/${formData.centre_id}`, {}, true); // Public endpoint
        if (response.ok) {
          const data = await response.json();
          setMedecins(data.data || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des médecins:', error);
        setError('Erreur lors du chargement des médecins');
      }
    };

    loadMedecins();
  }, [formData.centre_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Réinitialiser le médecin si le centre change
    if (name === 'centre_id') {
      setFormData(prev => ({
        ...prev,
        medecin_id: ''
      }));
    }
  };

  const validateForm = () => {
    if (!formData.centre_id || !formData.medecin_id || !formData.date_rdv || !formData.heure_rdv || !formData.motif) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    const selectedDate = new Date(formData.date_rdv);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError('La date du rendez-vous ne peut pas être dans le passé');
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
      const response = await apiFetch('/rendez-vous', {
        method: 'POST',
        body: JSON.stringify({
          centre_id: parseInt(formData.centre_id),
          medecin_id: parseInt(formData.medecin_id),
          patient_id: user?.id_user, // ID du patient connecté
          date_rdv: formData.date_rdv,
          heure_rdv: formData.heure_rdv,
          motif: formData.motif,
          notes: formData.notes || null,
          statut: 'planifie'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Rendez-vous pris avec succès !');
        setTimeout(() => {
          navigate('/patient/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Erreur lors de la prise du rendez-vous');
      }
    } catch (error) {
      console.error('Erreur lors de la prise du rendez-vous:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Calendar className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Prendre un rendez-vous
            </h1>
            <p className="text-gray-600">
              Choisissez votre centre de santé et votre médecin
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Centre de santé */}
              <div>
                <label htmlFor="centre_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Centre de santé *
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
                    <option value="">Sélectionnez un centre de santé</option>
                    {centres.map((centre) => (
                      <option key={centre.id_centre} value={centre.id_centre}>
                        {centre.nom_centre} - {centre.nom_region}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Vous pouvez choisir n'importe quel centre de santé
                </p>
              </div>

              {/* Médecin */}
              <div>
                <label htmlFor="medecin_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Médecin *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Stethoscope className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="medecin_id"
                    name="medecin_id"
                    value={formData.medecin_id}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={!formData.centre_id}
                  >
                    <option value="">
                      {formData.centre_id ? 'Sélectionnez un médecin' : 'Choisissez d\'abord un centre'}
                    </option>
                    {medecins.map((medecin) => (
                      <option key={medecin.id_medecin} value={medecin.id_medecin}>
                        Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date du rendez-vous */}
              <div>
                <label htmlFor="date_rdv" className="block text-sm font-medium text-gray-700 mb-2">
                  Date du rendez-vous *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="date_rdv"
                    name="date_rdv"
                    type="date"
                    value={formData.date_rdv}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Heure du rendez-vous */}
              <div>
                <label htmlFor="heure_rdv" className="block text-sm font-medium text-gray-700 mb-2">
                  Heure du rendez-vous *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="heure_rdv"
                    name="heure_rdv"
                    type="time"
                    value={formData.heure_rdv}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Motif du rendez-vous */}
            <div>
              <label htmlFor="motif" className="block text-sm font-medium text-gray-700 mb-2">
                Motif du rendez-vous *
              </label>
              <textarea
                id="motif"
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Décrivez brièvement le motif de votre rendez-vous"
                required
              />
            </div>

            {/* Notes supplémentaires */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes supplémentaires (optionnel)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Informations supplémentaires pour le médecin"
              />
            </div>

            {/* Messages d'erreur et de succès */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
              >
                {error}
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

            {/* Boutons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/patient/dashboard')}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Annuler
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Prise du rendez-vous...
                  </div>
                ) : (
                  'Prendre le rendez-vous'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BookAppointment;
