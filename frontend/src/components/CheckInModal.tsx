import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  User,
  Calendar,
  Stethoscope,
  AlertCircle as InfoIcon
} from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  patientInfo: {
    nom: string;
    prenom: string;
    heure?: string;
    motif?: string;
    medecin?: string;
    age?: number;
  };
  loading?: boolean;
}

const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patientInfo,
  loading = false
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleConfirm = async () => {
    setIsChecking(true);
    setCheckInStatus('idle');
    
    try {
      await onConfirm();
      setCheckInStatus('success');
      
      // Son de succès (optionnel)
      if (typeof Audio !== 'undefined') {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjCM0vHLdisFA==');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
      
      // Fermer après 1.5 secondes
      setTimeout(() => {
        onClose();
        setCheckInStatus('idle');
      }, 1500);
    } catch (error) {
      setCheckInStatus('error');
      setTimeout(() => {
        setCheckInStatus('idle');
      }, 3000);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Header avec animation */}
          <div className={`p-6 ${
            checkInStatus === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' :
            checkInStatus === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
            'bg-gradient-to-r from-blue-500 to-blue-600'
          } transition-all duration-500`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {checkInStatus === 'success' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                ) : checkInStatus === 'error' ? (
                  <XCircle className="w-10 h-10 text-white" />
                ) : (
                  <UserCheck className="w-10 h-10 text-white" />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {checkInStatus === 'success' ? 'Check-in Réussi !' :
                     checkInStatus === 'error' ? 'Erreur Check-in' :
                     'Confirmer le Check-in'}
                  </h3>
                  <p className="text-white text-opacity-90 text-sm">
                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
              {checkInStatus === 'idle' && (
                <button
                  onClick={onClose}
                  disabled={isChecking}
                  className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Corps du modal */}
          <div className="p-6">
            {checkInStatus === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Patient enregistré avec succès
                </p>
                <p className="text-gray-600">
                  {patientInfo.prenom} {patientInfo.nom} a été enregistré(e) à {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            ) : checkInStatus === 'error' ? (
              <div className="text-center py-8">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Erreur lors du check-in
                </p>
                <p className="text-gray-600">
                  Veuillez réessayer ou contacter le support
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Informations patient */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">
                        {patientInfo.prenom} {patientInfo.nom}
                      </p>
                      {patientInfo.age && (
                        <p className="text-sm text-gray-600">{patientInfo.age} ans</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations rendez-vous */}
                <div className="space-y-3">
                  {patientInfo.heure && (
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Heure prévue</p>
                        <p className="font-medium">{patientInfo.heure}</p>
                      </div>
                    </div>
                  )}
                  
                  {patientInfo.medecin && (
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Stethoscope className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Médecin</p>
                        <p className="font-medium">{patientInfo.medecin}</p>
                      </div>
                    </div>
                  )}
                  
                  {patientInfo.motif && (
                    <div className="flex items-start space-x-3 text-gray-700">
                      <InfoIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Motif</p>
                        <p className="font-medium">{patientInfo.motif}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Heure actuelle */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Heure d'arrivée</span>
                    <span className="text-lg font-bold text-blue-600">
                      {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Note d'information */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <InfoIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      Le patient sera automatiquement ajouté à la file d'attente. Le médecin sera notifié de son arrivée.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer avec boutons */}
          {checkInStatus === 'idle' && (
            <div className="px-6 pb-6">
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  disabled={isChecking}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isChecking}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>Confirmer Check-in</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckInModal;

