import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/apiFetch';
import { useToast } from '../context/ToastContext';
import {
  Clock,
  Activity,
  UserPlus,
  AlertTriangle,
  Play,
  RefreshCw,
  UserX
} from 'lucide-react';

interface FileAttenteTabProps {
  onRefresh?: () => void;
}

const FileAttenteTab: React.FC<FileAttenteTabProps> = ({ onRefresh }) => {
  const [fileAttente, setFileAttente] = useState<any[]>([]);
  const [statsFile, setStatsFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterMedecin, setFilterMedecin] = useState<string>('all');
  const [filterPriorite, setFilterPriorite] = useState<string>('all');
  const [medecins, setMedecins] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchFileAttente();
    fetchStatsFile();
    fetchMedecins();

    // Écouter l'événement de rafraîchissement manuel
    const handleRefresh = () => {
      fetchFileAttente();
      fetchStatsFile();
    };
    window.addEventListener('refresh-file-attente', handleRefresh);

    return () => {
      window.removeEventListener('refresh-file-attente', handleRefresh);
    };
  }, [filterMedecin, filterPriorite]);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    console.log('🔄 Auto-refresh activé pour file d\'attente (30s)');

    const interval = setInterval(() => {
      console.log('🔄 Rafraîchissement automatique...');
      fetchFileAttente();
      fetchStatsFile();
    }, 30000); // 30 secondes

    return () => {
      console.log('🛑 Auto-refresh arrêté');
      clearInterval(interval);
    };
  }, [autoRefreshEnabled, filterMedecin, filterPriorite]);

  const fetchFileAttente = async () => {
    try {
      let url = '/personnel/file-attente';
      const params = new URLSearchParams();
      if (filterMedecin !== 'all') params.append('medecin_id', filterMedecin);
      if (filterPriorite !== 'all') params.append('statut', filterPriorite);
      if (params.toString()) url += '?' + params.toString();

      const response = await apiFetch(url);
      const data = await response.json();
      if (data.success) {
        // Trier pour mettre les patients urgents en premier
        const sortedData = (data.data || []).sort((a: any, b: any) => {
          // Les patients urgents en premier
          if (a.priorite === 'urgente' && b.priorite !== 'urgente') return -1;
          if (a.priorite !== 'urgente' && b.priorite === 'urgente') return 1;
          // Sinon, garder l'ordre d'arrivée (par position_file ou heure_arrivee)
          return (a.position_file || 0) - (b.position_file || 0);
        });

        setFileAttente(sortedData);
        setLastUpdate(new Date()); // Mettre à jour le timestamp
      }
    } catch (error) {
      console.error('Erreur fetch file attente:', error);
      showToast('Erreur lors du chargement de la file d\'attente', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsFile = async () => {
    try {
      const response = await apiFetch('/personnel/file-attente/stats');
      const data = await response.json();
      if (data.success) {
        setStatsFile(data.data);
      }
    } catch (error) {
      console.error('Erreur fetch stats file:', error);
    }
  };

  const fetchMedecins = async () => {
    try {
      const response = await apiFetch('/medecins');
      const data = await response.json();
      if (data.success) {
        setMedecins(data.data || []);
      }
    } catch (error) {
      console.error('Erreur fetch médecins:', error);
    }
  };

  const handleAppelerPatient = async (rdvId: number) => {
    try {
      const response = await apiFetch(`/personnel/file-attente/${rdvId}/appeler`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        showToast('Patient appelé avec succès !', 'success');
        fetchFileAttente();
        fetchStatsFile();
        if (onRefresh) onRefresh();
      }
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  };

  const handleChangerPriorite = async (rdvId: number, priorite: string) => {
    try {
      const response = await apiFetch(`/personnel/file-attente/${rdvId}/priorite`, {
        method: 'PUT',
        body: JSON.stringify({ priorite })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Priorité mise à jour', 'success');
        fetchFileAttente();
        fetchStatsFile();
      }
    } catch (error: any) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  };

  const handleMarquerAbsent = async (rdvId: number, patientNom: string) => {
    if (!confirm(`Marquer ${patientNom} comme absent ?`)) {
      return;
    }

    try {
      const response = await apiFetch(`/personnel/file-attente/${rdvId}/marquer-absent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        showToast(`${patientNom} marqué comme absent`, 'info');
        fetchFileAttente();
        fetchStatsFile();
        if (onRefresh) onRefresh();
      } else {
        throw new Error(data.message || 'Erreur');
      }
    } catch (error: any) {
      console.error('Erreur marquer absent:', error);
      showToast(error.message || 'Erreur lors du marquage absent', 'error');
    }
  };

  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return '';

    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);

    if (seconds < 60) return `Il y a ${seconds}s`;
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`;
    return `Il y a ${Math.floor(seconds / 3600)}h`;
  };

  const filteredFile = fileAttente.filter((item) => {
    if (filterMedecin !== 'all' && item.id_medecin?.toString() !== filterMedecin) return false;
    if (filterPriorite !== 'all' && item.priorite !== filterPriorite) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques File d'Attente */}
      {statsFile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">En attente</p>
                <p className="text-3xl font-bold mt-1">{statsFile.total_en_attente}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Temps d'attente moyen</p>
                <p className="text-3xl font-bold mt-1">{statsFile.temps_attente_moyen} min</p>
              </div>
              <Activity className="w-12 h-12 text-blue-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Walk-ins aujourd'hui</p>
                <p className="text-3xl font-bold mt-1">
                  {statsFile.repartition_type?.find((t: any) => t.type_rdv === 'walk-in')?.count || 0}
                </p>
              </div>
              <UserPlus className="w-12 h-12 text-purple-200" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par médecin</label>
            <select
              value={filterMedecin}
              onChange={(e) => setFilterMedecin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tous les médecins</option>
              {medecins.map((medecin) => (
                <option key={medecin.id_medecin || medecin.id} value={medecin.id_medecin || medecin.id}>
                  Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par priorité</label>
            <select
              value={filterPriorite}
              onChange={(e) => setFilterPriorite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="urgente">Urgente</option>
              <option value="normale">Normale</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchFileAttente}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste File d'Attente */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">File d'Attente</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              {lastUpdate && (
                <>
                  <span className="flex items-center space-x-1">
                    <RefreshCw className={`w-3 h-3 ${autoRefreshEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-gray-500">{getTimeSinceUpdate()}</span>
                  </span>
                  <button
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    className={`text-xs px-2 py-1 rounded ${autoRefreshEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                    title={autoRefreshEnabled ? 'Désactiver auto-refresh' : 'Activer auto-refresh'}
                  >
                    {autoRefreshEnabled ? '✓ Auto-refresh' : 'Auto-refresh OFF'}
                  </button>
                </>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-600">{filteredFile.length} patient(s)</span>
        </div>

        {filteredFile.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Aucun patient en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFile.map((item, index) => (
              <motion.div
                key={item.id_rdv}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 border-2 rounded-lg ${item.priorite === 'urgente' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold">
                      {item.position_file}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{item.patient_nom}</h4>
                        {item.type_rdv === 'walk-in' && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                            Walk-in
                          </span>
                        )}
                        {item.priorite === 'urgente' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Dr. {item.medecin_nom} • {item.specialite}</p>
                      <p className="text-sm text-gray-500">{item.symptomes?.motif || 'Consultation'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Attente: {item.temps_attente_minutes} min • {item.telephone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.priorite !== 'urgente' && (
                      <button
                        onClick={() => handleChangerPriorite(item.id_rdv, 'urgente')}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center space-x-1"
                        title="Marquer comme urgent"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Urgent</span>
                      </button>
                    )}
                    {item.priorite === 'urgente' && (
                      <button
                        onClick={() => handleChangerPriorite(item.id_rdv, 'normale')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                        title="Marquer comme normale"
                      >
                        Normaliser
                      </button>
                    )}
                    {/* Bouton Marquer absent - Visible si retard > 15 min */}
                    {item.statut !== 'en_cours' && item.temps_attente_minutes > 15 && (
                      <button
                        onClick={() => handleMarquerAbsent(item.id_rdv, item.patient_nom)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                        title="Marquer comme absent"
                      >
                        <UserX className="w-4 h-4" />
                        <span>Absent</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleAppelerPatient(item.id_rdv)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Appeler</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileAttenteTab;

