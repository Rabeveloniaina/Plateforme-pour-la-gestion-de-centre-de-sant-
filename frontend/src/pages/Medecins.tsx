import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/apiFetch';
import { 
  Stethoscope, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  specialite: string;
  telephone: string;
  email: string;
  centre: string;
  statut: 'disponible' | 'en_consultation' | 'pause' | 'indisponible';
  date_embauche: string;
  horaires: {
    debut: string;
    fin: string;
    jours: string[];
  };
  patients_aujourdhui: number;
  consultations_totales: number;
}

const Medecins: React.FC = () => {
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [filterSpecialite, setFilterSpecialite] = useState<string>('tous');
  const [filterCentre, setFilterCentre] = useState<string>('tous');
  const [showFilters, setShowFilters] = useState(false);

	useEffect(() => {
    fetchMedecins();
  }, []);

  const fetchMedecins = async () => {
    try {
      setLoading(true);
      
      const response = await apiFetch('/medecins');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Données médecins récupérées:', data);
      
      // Transformer les données de l'API vers le format attendu
      const medecinsData: Medecin[] = (Array.isArray(data.data) ? data.data : []).map((medecin: any) => ({
        id: medecin.id_medecin,
        nom: medecin.nom,
        prenom: medecin.prenom,
        specialite: medecin.specialite || 'Médecine générale',
        telephone: medecin.telephone || '',
        email: medecin.email || '',
        centre: medecin.centre?.nom || 'Centre de Santé',
        statut: medecin.statut || 'disponible',
        date_embauche: medecin.date_embauche || new Date().toISOString().split('T')[0],
        horaires: medecin.horaires || {
          debut: '08:00',
          fin: '17:00',
          jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
        },
        patients_aujourdhui: medecin.patients_aujourdhui || 0,
        consultations_totales: medecin.consultations_totales || 0
      })) || [];
      
      setMedecins(medecinsData);
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
      setMedecins([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedecins = medecins.filter(medecin => {
    const matchesSearch = 
      medecin.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medecin.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medecin.specialite.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medecin.telephone.includes(searchTerm) ||
      medecin.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'tous' || medecin.statut === filterStatus;
    const matchesSpecialite = filterSpecialite === 'tous' || medecin.specialite === filterSpecialite;
    const matchesCentre = filterCentre === 'tous' || medecin.centre === filterCentre;
    
    return matchesSearch && matchesStatus && matchesSpecialite && matchesCentre;
  });

  const handleDeleteMedecin = (medecinId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      setMedecins(medecins.filter(m => m.id !== medecinId));
    }
  };

  const handleExportMedecins = () => {
    // Logique d'export
    console.log('Export des médecins');
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'en_consultation':
        return 'bg-blue-100 text-blue-800';
      case 'pause':
        return 'bg-yellow-100 text-yellow-800';
      case 'indisponible':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'disponible':
        return 'Disponible';
      case 'en_consultation':
        return 'En consultation';
      case 'pause':
        return 'En pause';
      case 'indisponible':
        return 'Indisponible';
      default:
        return statut;
    }
  };

  if (loading) {
	return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des médecins...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Médecins</h1>
              <p className="text-gray-600">Gérez tous les médecins du système</p>
								</div>
            <div className="flex items-center space-x-3">
								<button 
                onClick={handleExportMedecins}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
								>
                <Download className="w-4 h-4" />
                <span>Exporter</span>
								</button>
              <Link
                to="/medecins/nouveau"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Médecin</span>
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
								placeholder="Rechercher un médecin..."
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="disponible">Disponible</option>
                    <option value="en_consultation">En consultation</option>
                    <option value="pause">En pause</option>
                    <option value="indisponible">Indisponible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</label>
                  <select
                    value={filterSpecialite}
                    onChange={(e) => setFilterSpecialite(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Toutes les spécialités</option>
                    <option value="Médecine générale">Médecine générale</option>
                    <option value="Cardiologie">Cardiologie</option>
                    <option value="Dermatologie">Dermatologie</option>
                    <option value="Pédiatrie">Pédiatrie</option>
                    <option value="Gynécologie">Gynécologie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Centre</label>
							<select 
                    value={filterCentre}
                    onChange={(e) => setFilterCentre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Tous les centres</option>
                    <option value="Centre de Santé Paris 1">Centre de Santé Paris 1</option>
                    <option value="Centre de Santé Lyon 2">Centre de Santé Lyon 2</option>
                    <option value="Centre de Santé Marseille 3">Centre de Santé Marseille 3</option>
				</select>
			</div>
              </div>
						</div>
					)}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Médecins</p>
                <p className="text-2xl font-bold text-gray-900">{medecins.length}</p>
              </div>
              <Stethoscope className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">
                  {medecins.filter(m => m.statut === 'disponible').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En consultation</p>
                <p className="text-2xl font-bold text-blue-600">
                  {medecins.filter(m => m.statut === 'en_consultation').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Indisponibles</p>
                <p className="text-2xl font-bold text-red-600">
                  {medecins.filter(m => m.statut === 'indisponible').length}
                </p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
							</div>

        {/* Liste des médecins */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Liste des Médecins ({filteredMedecins.length})
            </h3>
          </div>
								<div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médecin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécialité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patients Aujourd'hui
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horaires
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
						</tr>
					</thead>
										<tbody className="bg-white divide-y divide-gray-200">
                {filteredMedecins.map((medecin) => (
                  <motion.tr
                    key={medecin.id}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    className="hover:bg-gray-50"
                  >
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
															<div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {medecin.prenom} {medecin.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            Embauché le {new Date(medecin.date_embauche).toLocaleDateString('fr-FR')}
                          </div>
															</div>
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {medecin.specialite}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{medecin.telephone}</div>
                      <div className="text-sm text-gray-500">{medecin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{medecin.centre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(medecin.statut)}`}>
                        {getStatusLabel(medecin.statut)}
                      </span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{medecin.patients_aujourdhui}</div>
                      <div className="text-sm text-gray-500">Total: {medecin.consultations_totales}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-900">
                        {medecin.horaires.debut} - {medecin.horaires.fin}
																</div>
                      <div className="text-sm text-gray-500">
                        {medecin.horaires.jours.join(', ')}
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
														<div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/medecins/${medecin.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/medecins/${medecin.id}/modifier`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
															<button 
                          onClick={() => handleDeleteMedecin(medecin.id)}
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

export default Medecins;