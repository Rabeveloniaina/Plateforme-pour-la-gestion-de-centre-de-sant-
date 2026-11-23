import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import { parseLocalDate } from '../utils/dateFormatter';

interface CheckInStatusProps {
  heureArrivee?: string | null;
  statut: string;
  heureRdv?: string;
  compact?: boolean;
}

const CheckInStatus: React.FC<CheckInStatusProps> = ({
  heureArrivee,
  statut,
  heureRdv,
  compact = false
}) => {
  const [tempsAttente, setTempsAttente] = useState<string>('');
  const [isLate, setIsLate] = useState(false);

  useEffect(() => {
    if (!heureArrivee) return;

    const updateTempsAttente = () => {
      try {
        // Parser l'heure d'arrivée
        let dateArrivee: Date;
        
        if (typeof heureArrivee === 'string') {
          // Si c'est juste une heure (HH:MM:SS ou HH:MM)
          if (heureArrivee.includes(':') && !heureArrivee.includes('T') && !heureArrivee.includes(' ')) {
            const today = new Date();
            const [h, m, s] = heureArrivee.split(':').map(Number);
            dateArrivee = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, s || 0);
          } else {
            // Format complet datetime - utiliser parseLocalDate
            dateArrivee = parseLocalDate(heureArrivee) || new Date();
          }
        } else {
          dateArrivee = parseLocalDate(heureArrivee) || new Date();
        }

        const maintenant = new Date();
        const diffMs = maintenant.getTime() - dateArrivee.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);

        if (diffMinutes < 0) {
          setTempsAttente('À venir');
          setIsLate(false);
        } else if (diffMinutes === 0) {
          setTempsAttente('À l\'instant');
          setIsLate(false);
        } else if (diffMinutes < 60) {
          setTempsAttente(`${diffMinutes} min`);
          setIsLate(diffMinutes > 30);
        } else {
          const heures = Math.floor(diffMinutes / 60);
          const minutes = diffMinutes % 60;
          setTempsAttente(`${heures}h ${minutes}min`);
          setIsLate(true);
        }
      } catch (error) {
        console.error('Erreur calcul temps d\'attente:', error);
        setTempsAttente('N/A');
      }
    };

    updateTempsAttente();
    const interval = setInterval(updateTempsAttente, 10000); // Update toutes les 10 secondes

    return () => clearInterval(interval);
  }, [heureArrivee]);

  // Si pas de check-in effectué
  if (!heureArrivee) {
    return (
      <div className={`inline-flex items-center ${
        compact ? 'px-2 py-1' : 'px-3 py-1.5'
      } rounded-full bg-gray-100 text-gray-600`}>
        <Clock className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
          Non arrivé
        </span>
      </div>
    );
  }

  // Format compact pour les listes
  if (compact) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full ${
        isLate ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
      }`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        <span className="text-xs font-medium">
          {tempsAttente}
        </span>
      </div>
    );
  }

  // Format détaillé
  return (
    <div className={`inline-flex flex-col ${
      isLate ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
    } border rounded-lg px-3 py-2 min-w-[120px]`}>
      <div className="flex items-center space-x-2 mb-1">
        <CheckCircle className={`w-4 h-4 ${
          isLate ? 'text-orange-600' : 'text-green-600'
        }`} />
        <span className={`text-xs font-medium ${
          isLate ? 'text-orange-700' : 'text-green-700'
        }`}>
          Arrivé
        </span>
      </div>
      <div className="text-xs text-gray-600">
        {(() => {
          try {
            let dateArrivee: Date;
            if (typeof heureArrivee === 'string') {
              if (heureArrivee.includes(':') && !heureArrivee.includes('T') && !heureArrivee.includes(' ')) {
                const today = new Date();
                const [h, m] = heureArrivee.split(':').map(Number);
                dateArrivee = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
              } else {
                dateArrivee = parseLocalDate(heureArrivee) || new Date();
              }
            } else {
              dateArrivee = parseLocalDate(heureArrivee as any) || new Date();
            }
            return dateArrivee.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          } catch {
            return heureArrivee;
          }
        })()}
      </div>
      {tempsAttente && (
        <div className={`flex items-center space-x-1 mt-1 ${
          isLate ? 'text-orange-600' : 'text-gray-600'
        }`}>
          <Timer className="w-3 h-3" />
          <span className="text-xs font-medium">
            {tempsAttente} d'attente
          </span>
        </div>
      )}
      {isLate && (
        <div className="flex items-center space-x-1 mt-1">
          <AlertCircle className="w-3 h-3 text-orange-600" />
          <span className="text-xs text-orange-600 font-medium">
            Attente prolongée
          </span>
        </div>
      )}
    </div>
  );
};

export default CheckInStatus;

