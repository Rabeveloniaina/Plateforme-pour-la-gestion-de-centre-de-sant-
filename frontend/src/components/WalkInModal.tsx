import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Save, AlertCircle, CheckCircle, Phone, User, Calendar, Stethoscope } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Medecin {
  id_medecin: number;
  nom: string;
  prenom: string;
  specialite: string;
  statut_operationnel: string;
  statut?: string;
}

const WalkInModal: React.FC<WalkInModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ position_file?: number; temps_attente_estime?: number } | null>(null);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    date_naissance: '',
    sexe: 'M',
    adresse: '',
    email: '',
    groupe_sanguin: '',
    medecin_id: '',
    motif: '',
    symptomes: '',
    priorite: 'normale'
  });

  useEffect(() => {
    if (isOpen) {
      fetchMedecinsDisponibles();
    }
  }, [isOpen]);

  const fetchMedecinsDisponibles = async () => {
    try {
      // 1) Récupérer le centre de l'utilisateur via les statistiques personnel (retourne centre.id)
      const statsRes = await apiFetch('/statistiques/personnel');
      if (!statsRes.ok) {
        const err = await statsRes.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible de récupérer le centre de l’utilisateur');
      }
      const statsData = await statsRes.json();
      const centreId = statsData?.data?.centre?.id;
      if (!centreId) {
        setError('Centre non trouvé pour cet utilisateur');
        return;
      }

      // 2) Calculer le prochain créneau de 15 minutes (créneau le plus tôt possible)
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      // Arrondir à la tranche de 15 minutes supérieure
      const minutes = now.getMinutes();
      const roundedMinutes = Math.ceil((minutes + 1) / 15) * 15; // +1 pour éviter un créneau quasi terminé
      const nextSlot = new Date(now);
      nextSlot.setMinutes(roundedMinutes, 0, 0);
      // Si dépassement d'heure (e.g., 10:59 -> 11:15), la date s'ajuste automatiquement
      const hh = String(nextSlot.getHours()).padStart(2, '0');
      const mi = String(nextSlot.getMinutes()).padStart(2, '0');
      const date_rdv = `${yyyy}-${mm}-${dd}`;
      const heure_rdv = `${hh}:${mi}`;

      // 3) Demander au backend les médecins du centre disponibles pour l’instant précis
      const url = `/medecins/centre/${centreId}?disponible=true&date_rdv=${encodeURIComponent(date_rdv)}&heure_rdv=${encodeURIComponent(heure_rdv)}`;
      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        // Le backend exclut déjà les médecins en chevauchement; on garde un filtre léger sur le statut
        const medecinsDisponibles = (data.data || []).filter((m: Medecin) =>
          (m.statut === 'actif' || !m.statut)
        );
        setMedecins(medecinsDisponibles);
        setError(medecinsDisponibles.length === 0 ? 'Aucun médecin disponible actuellement dans votre centre' : '');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors du chargement des médecins');
      }
    } catch (error: any) {
      console.error('Erreur chargement médecins:', error);
      setError(error.message || 'Erreur lors du chargement des médecins');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/personnel/walk-in', {
        method: 'POST',
        body: JSON.stringify({
          patient: {
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            date_naissance: formData.date_naissance || '1990-01-01',
            sexe: formData.sexe,
            adresse: formData.adresse || 'Non renseignée',
            email: formData.email || null,
            groupe_sanguin: formData.groupe_sanguin || null
          },
          medecin_id: parseInt(formData.medecin_id),
          motif: formData.motif,
          symptomes: formData.symptomes ? formData.symptomes.split(',').map(s => s.trim()) : [],
          priorite: formData.priorite
        })
      });

      const data = await response.json();

      if (data.success || response.ok) {
        setSuccess(true);
        setSuccessData({
          position_file: data.data?.position_file,
          temps_attente_estime: data.data?.temps_attente_estime
        });
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 3000);
      } else {
        setError(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error: any) {
      setError(error.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nom: '',
      prenom: '',
      telephone: '',
      date_naissance: '',
      sexe: 'M',
      adresse: '',
      email: '',
      groupe_sanguin: '',
      medecin_id: '',
      motif: '',
      symptomes: '',
      priorite: 'normale'
    });
    setError('');
    setSuccess(false);
    setSuccessData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* En-tête */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserPlus className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Enregistrer Patient Walk-In</h2>
                  <p className="text-blue-100 text-sm">Patient sans rendez-vous</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">Patient walk-in enregistré avec succès !</p>
              </div>
              <div className="text-xs text-green-700 ml-7 space-y-1">
                <p>Le patient a été ajouté à la file d'attente et apparaîtra dans l'onglet "File d'Attente".</p>
                {successData?.position_file && (
                  <p className="font-medium">
                    Position dans la file : <span className="font-bold">{successData.position_file}</span>
                    {successData.temps_attente_estime && (
                      <span> • Temps d'attente estimé : <span className="font-bold">{successData.temps_attente_estime} min</span></span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informations patient */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Informations Patient
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom du patient"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prénom du patient"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="77 123 45 67"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexe
                  </label>
                  <select
                    value={formData.sexe}
                    onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Médecin et consultation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-green-600" />
                Consultation
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Médecin disponible *
                  </label>
                  <select
                    required
                    value={formData.medecin_id}
                    onChange={(e) => setFormData({ ...formData, medecin_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={medecins.length === 0}
                  >
                    <option value="">
                      {medecins.length === 0 ? 'Aucun médecin disponible actuellement' : 'Sélectionner un médecin'}
                    </option>
                    {medecins.map((medecin) => (
                      <option key={medecin.id_medecin} value={medecin.id_medecin}>
                        Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                      </option>
                    ))}
                  </select>
                  {medecins.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      Aucun médecin n'est actuellement disponible. Veuillez réessayer plus tard.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motif de consultation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Douleur abdominale, Fièvre..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symptômes (séparés par des virgules)
                  </label>
                  <textarea
                    value={formData.symptomes}
                    onChange={(e) => setFormData({ ...formData, symptomes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Fièvre, Maux de tête, Fatigue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité
                  </label>
                  <select
                    value={formData.priorite}
                    onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || success}
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
                    <span>Enregistrer Walk-In</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalkInModal;

