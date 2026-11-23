import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
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
  Download,
  Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  telephone: string;
  email: string;
  adresse: string;
  centre: string;
  groupe_sanguin: string;
  statut: 'actif' | 'inactif';
  date_inscription: string;
  derniere_consultation: string;
}

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [filterCentre, setFilterCentre] = useState<string>('tous');
  const [showFilters, setShowFilters] = useState(false);

	useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get<{success: boolean; data: any[]}>('/patients');
      const patientsData = (response.data || []).map((p: any) => ({
        id: p.id_patient || p.id,
        nom: p.nom || '',
        prenom: p.prenom || '',
        date_naissance: p.date_naissance || '',
        telephone: p.telephone || '',
        email: p.email || '',
        adresse: p.adresse || '',
        centre: p.centre_nom || p.centre || 'Non assigné',
        groupe_sanguin: p.groupe_sanguin || 'N/A',
        statut: p.statut || 'actif',
        date_inscription: p.created_at || p.date_inscription || '',
        derniere_consultation: p.derniere_consultation || ''
      }));
      setPatients(patientsData);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
			} finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.telephone.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'tous' || patient.statut === filterStatus;
    const matchesCentre = filterCentre === 'tous' || patient.centre === filterCentre;
    
    return matchesSearch && matchesStatus && matchesCentre;
  });

  const handleDeletePatient = async (patientId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) return;
    try {
      await api.delete(`/patients/${patientId}`);
      setPatients(patients.filter(p => p.id !== patientId));
    } catch (error) {
      console.error('Erreur lors de la suppression du patient:', error);
    }
  };

  const handleExportPatients = () => {
    // Logique d'export
    console.log('Export des patients');
  };

  if (loading) {
	return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des patients...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Patients</h1>
              <p className="text-gray-600">Gérez tous les patients du système</p>
								</div>
            <div className="flex items-center space-x-3">
								<button 
                onClick={handleExportPatients}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
								>
                <Download className="w-4 h-4" />
                <span>Exporter</span>
								</button>
              <Link
                to="/patients/nouveau"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Patient</span>
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
                  placeholder="Rechercher un patient..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patients Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {patients.filter(p => p.statut === 'actif').length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patients Inactifs</p>
                <p className="text-2xl font-bold text-red-600">
                  {patients.filter(p => p.statut === 'inactif').length}
                </p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nouveaux ce mois</p>
                <p className="text-2xl font-bold text-purple-600">
                  {patients.filter(p => new Date(p.date_inscription).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
							</div>

        {/* Liste des patients */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Liste des Patients ({filteredPatients.length})
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Groupe Sanguin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière Consultation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
						</tr>
					</thead>
										<tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <motion.tr
                    key={patient.id}
                    whileHover={{ backgroundColor: '#f9fafb' }}
                    className="hover:bg-gray-50"
                  >
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {patient.prenom[0]}{patient.nom[0]}
                            </span>
                          </div>
                        </div>
															<div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.prenom} {patient.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            Né(e) le {new Date(patient.date_naissance).toLocaleDateString('fr-FR')}
                          </div>
															</div>
														</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.telephone}</div>
                      <div className="text-sm text-gray-500">{patient.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.centre}</div>
                      <div className="text-sm text-gray-500">{patient.adresse}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {patient.groupe_sanguin}
                      </span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.statut === 'actif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {patient.statut === 'actif' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.derniere_consultation ? 
                        new Date(patient.derniere_consultation).toLocaleDateString('fr-FR') : 
                        'Jamais'
                      }
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
														<div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/patients/${patient.id}/modifier`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
															<button 
                          onClick={() => handleDeletePatient(patient.id)}
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

export default Patients;