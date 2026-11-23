import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clipboard, User, Calendar, Pill, AlertCircle, CheckCircle, 
  ArrowLeft, Edit, Trash2, Download, Printer, Clock
} from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

interface Prescription {
  id_prescription: number;
  id_patient: number;
  patient_nom: string;
  patient_prenom: string;
  id_medecin: number;
  medecin_nom: string;
  medecin_prenom: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  instructions_generales: string;
  medicaments: Array<{
    nom_medicament: string;
    dosage: string;
    frequence: string;
    duree_traitement: string;
    instructions: string;
  }>;
  created_at: string;
}

const PrescriptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      const response = await apiFetch(`/prescriptions/${id}`);

      if (response.ok) {
        const data = await response.json();
        setPrescription(data.data);
      } else {
        setError('Erreur lors du chargement de la prescription');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette prescription ?')) {
      return;
    }

    try {
      const response = await apiFetch(`/prescriptions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        navigate('/prescriptions');
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      alert('Erreur de connexion au serveur');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      actif: 'bg-green-100 text-green-800 border-green-200',
      termine: 'bg-gray-100 text-gray-800 border-gray-200',
      suspendu: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      arrete: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[statut as keyof typeof styles] || styles.actif}`}>
        {statut.charAt(0).toUpperCase() + statut.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/prescriptions"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux prescriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to="/prescriptions" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux prescriptions
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clipboard className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Prescription #{prescription.id_prescription}
                </h1>
                <p className="text-gray-600 mt-1">
                  Créée le {new Date(prescription.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>
              <Link
                to={`/prescriptions/${id}/modifier`}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Informations générales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Informations générales</h2>
              {getStatutBadge(prescription.statut)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <User className="w-4 h-4 inline mr-2" />
                  Patient
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {prescription.patient_prenom} {prescription.patient_nom}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <User className="w-4 h-4 inline mr-2" />
                  Médecin prescripteur
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  Dr. {prescription.medecin_prenom} {prescription.medecin_nom}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de début
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(prescription.date_debut).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de fin
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {prescription.date_fin 
                    ? new Date(prescription.date_fin).toLocaleDateString('fr-FR')
                    : 'Non spécifiée'
                  }
                </p>
              </div>
            </div>

            {prescription.instructions_generales && (
              <div className="mt-6 pt-6 border-t">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  Instructions générales
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {prescription.instructions_generales}
                </p>
              </div>
            )}
          </motion.div>

          {/* Médicaments prescrits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Pill className="w-5 h-5 mr-2 text-blue-600" />
              Médicaments prescrits ({prescription.medicaments.length})
            </h2>

            <div className="space-y-4">
              {prescription.medicaments.map((med, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{med.nom_medicament}</h3>
                      <p className="text-sm text-gray-600 mt-1">Dosage: {med.dosage}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {med.duree_traitement}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">
                        <strong>Fréquence:</strong> {med.frequence}
                      </span>
                    </div>
                  </div>

                  {med.instructions && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong className="text-gray-900">Instructions:</strong> {med.instructions}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Note de bas de page (pour l'impression) */}
          <div className="hidden print:block bg-gray-100 p-4 rounded text-xs text-gray-600 text-center">
            <p>Ce document est une prescription médicale officielle.</p>
            <p>Délivré par le Système de Gestion Sanitaire - Ministère de la Santé Publique de Madagascar</p>
            <p className="mt-2">Date d'impression: {new Date().toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetail;

