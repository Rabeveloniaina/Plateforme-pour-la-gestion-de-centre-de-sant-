import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '../utils/apiFetch';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Users,
  Stethoscope,
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Centre {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  region: string;
  statut: 'actif' | 'inactif' | 'maintenance';
  date_creation: string;
  nombre_medecins: number;
  nombre_patients: number;
  consultations_aujourdhui: number;
  taux_occupation: number;
  directeur: string;
  specialites: string[];
}

const Centres: React.FC = () => {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [filterRegion, setFilterRegion] = useState<string>('tous');
  const [showFilters, setShowFilters] = useState(false);

	useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      setLoading(true);
      
      const response = await apiFetch('/centres');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Données centres récupérées:', data);
      
      // Transformer les données de l'API vers le format attendu
      const centresData: Centre[] = (Array.isArray(data.data) ? data.data : []).map((centre: any) => ({
        id: centre.id_centre,
        nom: centre.nom,
        adresse: centre.adresse || '',
        telephone: centre.telephone || '',
        email: centre.email || '',
        region: centre.nom_region || 'Région non définie',
        statut: centre.statut || 'actif',
        date_creation: centre.created_at || new Date().toISOString().split('T')[0],
        nombre_medecins: 0,
        nombre_patients: 0,
        consultations_aujourdhui: 0,
        taux_occupation: 0,
        directeur: '',
        specialites: []
      })) || [];
      
      setCentres(centresData);
    } catch (error) {
      console.error('Erreur lors du chargement des centres:', error);
      setCentres([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCentres = centres.filter(centre => {
    const matchesSearch = 
      centre.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centre.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centre.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      centre.telephone.includes(searchTerm) ||
      centre.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'tous' || centre.statut === filterStatus;
    const matchesRegion = filterRegion === 'tous' || centre.region === filterRegion;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const handleDeleteCentre = (centreId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce centre ?')) {
      setCentres(centres.filter(c => c.id !== centreId));
    }
  };

  const handleExportCentres = () => {
    // Logique d'export
    console.log('Export des centres');
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'actif':
        return 'bg-green-100 text-green-800';
      case 'inactif':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'actif':
        return 'Actif';
      case 'inactif':
        return 'Inactif';
      case 'maintenance':
        return 'Maintenance';
      default:
        return statut;
    }
  };

  if (loading) {
	return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des centres...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Centres</h1>
              <p className="text-gray-600">Gérez tous les centres de santé du système</p>
			</div>
            <div className="flex items-center space-x-3">
								<button 
                onClick={handleExportCentres}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
								>
                <Download className="w-4 h-4" />
                <span>Exporter</span>
								</button>
              <Link
                to="/centres/nouveau"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Centre</span>
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
								placeholder="Rechercher un centre..."
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
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
						</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
							<select 
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Toutes les régions</option>
                    <option value="Île-de-France">Île-de-France</option>
                    <option value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</option>
                    <option value="Provence-Alpes-Côte d'Azur">Provence-Alpes-Côte d'Azur</option>
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
                <p className="text-sm text-gray-600">Total Centres</p>
                <p className="text-2xl font-bold text-gray-900">{centres.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
							</div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Centres Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {centres.filter(c => c.statut === 'actif').length}
                </p>
											</div>
              <CheckCircle className="w-8 h-8 text-green-600" />
											</div>
										</div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Médecins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {centres.reduce((sum, c) => sum + c.nombre_medecins, 0)}
                </p>
									</div>
              <Stethoscope className="w-8 h-8 text-purple-600" />
											</div>
										</div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-orange-600">
                  {centres.reduce((sum, c) => sum + c.nombre_patients, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
											</div>
										</div>
			</div>

        {/* Liste des centres */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Liste des Centres ({filteredCentres.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Région
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personnel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCentres.map((centre) => (
                  <motion.tr
                    key={centre.id}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{centre.nom}</div>
                          <div className="text-sm text-gray-500">Directeur: {centre.directeur}</div>
										</div>
									</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{centre.adresse}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{centre.telephone}</div>
                      <div className="text-sm text-gray-500">{centre.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {centre.region}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(centre.statut)}`}>
                        {getStatusLabel(centre.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {centre.nombre_medecins} médecins
                      </div>
                      <div className="text-sm text-gray-500">
                        {centre.nombre_patients} patients
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${centre.taux_occupation}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{centre.taux_occupation}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {centre.consultations_aujourdhui} consultations aujourd'hui
							</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/centres/${centre.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/centres/${centre.id}/modifier`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
								<button 
                          onClick={() => handleDeleteCentre(centre.id)}
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

export default Centres;