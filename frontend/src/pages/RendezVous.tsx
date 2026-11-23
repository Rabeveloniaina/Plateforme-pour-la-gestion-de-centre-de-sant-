import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { parseLocalDate } from '../utils/dateFormatter';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  User,
  Stethoscope
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface RendezVous {
  id: number;
  patient: string;
  medecin: string;
  specialite: string;
  date: string;
  heure: string;
  motif: string;
  statut: 'confirme' | 'attente' | 'termine' | 'annule' | string;
  telephone: string;
  centre: string;
  notes: string;
}

const RendezVous: React.FC = () => {
  const [rdv, setRdv] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [filterDate, setFilterDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

	useEffect(() => {
    fetchRendezVous();
  }, []);

  const fetchRendezVous = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Appel API réel vers la base de données
      const response = await fetch('/api/rendez-vous', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Données RDV récupérées:', data);
      
      // Transformer les données de l'API vers le format attendu
      const rdvData: RendezVous[] = (Array.isArray(data.data) ? data.data : []).map((rdv: any) => ({
        id: rdv.id_rdv,
        patient: `${rdv.patient?.prenom || ''} ${rdv.patient?.nom || ''}`.trim(),
        medecin: `Dr. ${rdv.medecin?.prenom || ''} ${rdv.medecin?.nom || ''}`.trim(),
        specialite: rdv.medecin?.specialite || 'Médecine générale',
        date: rdv.date_rdv,
        heure: rdv.heure_rdv,
        motif: rdv.motif || 'Consultation',
        statut: rdv.statut,
        telephone: rdv.patient?.telephone || '',
        centre: rdv.centre?.nom || 'Centre de Santé',
        notes: rdv.notes || ''
      })) || [];
      
      setRdv(rdvData);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      // En cas d'erreur, afficher un message à l'utilisateur
      setRdv([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRdv = rdv.filter(rdvItem => {
    const matchesSearch = 
      rdvItem.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdvItem.medecin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdvItem.specialite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rdvItem.motif.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'tous' || rdvItem.statut === filterStatus;
    const matchesDate = !filterDate || rdvItem.date === filterDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDeleteRDV = (rdvId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      setRdv(rdv.filter(r => r.id !== rdvId));
    }
  };

  const handleStatusChange = (rdvId: number, newStatus: string) => {
    setRdv(rdv.map(r => r.id === rdvId ? { ...r, statut: newStatus as any } : r));
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'confirme':
        return 'bg-green-100 text-green-800';
      case 'attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'termine':
        return 'bg-gray-100 text-gray-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'confirme':
        return 'Confirmé';
      case 'attente':
        return 'En attente';
      case 'termine':
        return 'Terminé';
      case 'annule':
        return 'Annulé';
      default:
        return statut;
    }
  };

  if (loading) {
	return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rendez-vous...</p>
        </div>
							</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Rendez-vous</h1>
              <p className="text-gray-600">Gérez tous les rendez-vous du système</p>
								</div>
            <div className="flex items-center space-x-3">
								<button 
                onClick={() => console.log('Export RDV')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
								>
                <Download className="w-4 h-4" />
                <span>Exporter</span>
								</button>
              <Link
                to="/rendez-vous/nouveau"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau RDV</span>
              </Link>
							</div>
					</div>
				</div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input
                  type="text"
								placeholder="Rechercher un rendez-vous..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
			</div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>Filtres</span>
              </button>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
							<select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="confirme">Confirmé</option>
                    <option value="attente">En attente</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
				</select>
			</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
						</div>
					)}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total RDV</p>
                <p className="text-2xl font-bold text-gray-900">{rdv.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmés</p>
                <p className="text-2xl font-bold text-green-600">
                  {rdv.filter(r => r.statut === 'confirme').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {rdv.filter(r => r.statut === 'attente').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {rdv.filter(r => r.statut === 'en_cours').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-2xl font-bold text-gray-600">
                  {rdv.filter(r => r.statut === 'termine').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
							</div>

        {/* Liste des rendez-vous */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Liste des Rendez-vous ({filteredRdv.length})
            </h3>
          </div>
								<div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médecin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centre
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
						</tr>
					</thead>
										<tbody className="bg-white divide-y divide-gray-200">
                {filteredRdv.map((rdvItem) => (
                  <motion.tr
                    key={rdvItem.id}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    className="hover:bg-gray-50"
                  >
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
															<div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{rdvItem.patient}</div>
                          <div className="text-sm text-gray-500">{rdvItem.telephone}</div>
															</div>
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-green-600" />
                          </div>
															</div>
															<div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{rdvItem.medecin}</div>
                          <div className="text-sm text-gray-500">{rdvItem.specialite}</div>
															</div>
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{parseLocalDate(rdvItem.date)?.toLocaleDateString('fr-FR') || rdvItem.date}</div>
                      <div className="text-sm text-gray-500">{rdvItem.heure}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rdvItem.motif}</div>
                      {rdvItem.notes && (
                        <div className="text-sm text-gray-500">{rdvItem.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rdvItem.statut)}`}>
                        {getStatusLabel(rdvItem.statut)}
                      </span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rdvItem.centre}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
														<div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/rendez-vous/${rdvItem.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/rendez-vous/${rdvItem.id}/modifier`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {rdvItem.statut === 'attente' && (
                          <button
                            onClick={() => handleStatusChange(rdvItem.id, 'confirme')}
                            className="text-green-600 hover:text-green-900"
                            title="Confirmer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {rdvItem.statut !== 'annule' && (
															<button 
                            onClick={() => handleStatusChange(rdvItem.id, 'annule')}
                            className="text-red-600 hover:text-red-900"
                            title="Annuler"
															>
                            <XCircle className="w-4 h-4" />
															</button>
                        )}
                        <button
                          onClick={() => handleDeleteRDV(rdvItem.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
															</button>
														</div>
													</td>
                  </motion.tr>
						))}
					</tbody>
				</table>
			</div>
										</div>
									</div>
								</div>
  );
};

export default RendezVous;