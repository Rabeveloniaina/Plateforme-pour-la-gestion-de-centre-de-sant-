import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Building2,
  Users,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  UserPlus,
  Download
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

interface Centre {
  id_centre: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  region_id: number;
  region_nom: string;
  capacite_max: number;
  type_centre: string;
  statut: 'actif' | 'inactif' | 'maintenance';
  created_at: string;
}

interface CentreStats {
  nombre_medecins: number;
  nombre_patients: number;
  consultations_aujourdhui: number;
  consultations_semaine: number;
  consultations_mois: number;
  taux_occupation: number;
  rdv_en_attente: number;
  rdv_confirmes: number;
  rdv_annules: number;
}

interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  specialite: string;
  statut: 'disponible' | 'en_consultation' | 'pause' | 'indisponible';
  patients_aujourdhui: number;
}

const CentreDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [centre, setCentre] = useState<Centre | null>(null);
  const [stats, setStats] = useState<CentreStats | null>(null);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

	useEffect(() => {
    fetchCentreData();
  }, [id]);

  const fetchCentreData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données du centre
      const centreResponse = await apiFetch(`/centres/${id}`);
      
      if (!centreResponse.ok) {
        throw new Error(`Erreur HTTP: ${centreResponse.status}`);
      }
      
      const centreData = await centreResponse.json();
      console.log('🔍 Données centre récupérées:', centreData);
      
      // Récupérer les statistiques du centre
      const statsResponse = await apiFetch(`/statistiques/centre?centre_id=${id}`);
      
      let statsData = null;
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        statsData = statsResult.data || {
          nombre_medecins: 0,
          nombre_patients: 0,
          consultations_aujourdhui: 0,
          consultations_semaine: 0,
          consultations_mois: 0,
          taux_occupation: 0,
          rdv_en_attente: 0,
          rdv_confirmes: 0,
          rdv_annules: 0
        };
      }
      
      // Récupérer les médecins du centre
      const medecinsResponse = await apiFetch(`/medecins/centre/${id}`);
      
      let medecinsData = [];
      if (medecinsResponse.ok) {
        const medecinsResult = await medecinsResponse.json();
        medecinsData = medecinsResult.data || [];
      }
      
      // Transformer les données du centre
      if (centreData.success && centreData.data) {
        setCentre({
          id_centre: centreData.data.id_centre,
          nom: centreData.data.nom,
          adresse: centreData.data.adresse,
          telephone: centreData.data.telephone || '',
          email: centreData.data.email || '',
          region_id: centreData.data.region_id,
          region_nom: centreData.data.region_nom || 'Région',
          capacite_max: centreData.data.capacite_max || 0,
          type_centre: centreData.data.type_centre || 'centre_sante',
          statut: centreData.data.statut || 'actif',
          created_at: centreData.data.created_at || new Date().toISOString()
        });
      }
      
      // Définir les statistiques
      if (statsData) {
        setStats(statsData);
      }

      // Transformer les données des médecins
      const medecins: Medecin[] = medecinsData.map((medecin: any) => ({
        id: medecin.id_medecin,
        nom: medecin.nom,
        prenom: medecin.prenom,
        specialite: medecin.specialite || 'Médecine générale',
        statut: medecin.statut || 'disponible',
        patients_aujourdhui: medecin.patients_aujourdhui || 0
      }));

      setMedecins(medecins);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données du centre...</p>
        </div>
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Centre non trouvé</h2>
          <p className="text-gray-600 mb-4">Le centre demandé n'existe pas.</p>
          <Link
            to="/centres"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste</span>
          </Link>
			</div>
			</div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Building2 },
    { id: 'medecins', label: 'Médecins', icon: Stethoscope },
    { id: 'statistiques', label: 'Statistiques', icon: TrendingUp },
  ];

	return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
							<div className="flex items-center space-x-4">
								<Link 
									to="/centres" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
								>
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
								</Link>
									<div>
                <h1 className="text-2xl font-bold text-gray-900">{centre.nom}</h1>
                <p className="text-gray-600">{centre.region_nom} - {centre.adresse}</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
              <button
                onClick={() => console.log('Supprimer centre')}
                className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
								<Link
                to={`/centres/${centre.id_centre}/modifier`}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
								>
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
								</Link>
							</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informations principales */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations générales</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {centre.type_centre === 'poste_sante' ? 'Poste de santé' :
                         centre.type_centre === 'centre_sante' ? 'Centre de santé' :
                         centre.type_centre === 'hopital' ? 'Hôpital' : 'Clinique'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{centre.telephone || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{centre.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{centre.adresse}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Capacité</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Capacité maximale:</span> {centre.capacite_max} patients
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Région:</span> {centre.region_nom}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Créé le:</span> {new Date(centre.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Statut</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">État actuel:</span> 
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        centre.statut === 'actif' ? 'bg-green-100 text-green-800' :
                        centre.statut === 'inactif' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {centre.statut === 'actif' ? 'Actif' : centre.statut === 'inactif' ? 'Inactif' : 'Maintenance'}
                      </span>
                    </div>
                    {stats && (
                      <>
                    <div className="text-sm text-gray-600">
                          <span className="font-medium">Taux d'occupation:</span> {stats.taux_occupation}%
                    </div>
                    <div className="text-sm text-gray-600">
                          <span className="font-medium">Consultations aujourd'hui:</span> {stats.consultations_aujourdhui}
                    </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Onglet Vue d'ensemble */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Médecins</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.nombre_medecins}</p>
                      </div>
                      <Stethoscope className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">Patients</p>
                        <p className="text-2xl font-bold text-green-900">{stats.nombre_patients}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">Consultations aujourd'hui</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.consultations_aujourdhui}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600">Taux d'occupation</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.taux_occupation}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Cette semaine</h4>
                    <p className="text-3xl font-bold text-blue-600">{stats.consultations_semaine}</p>
                    <p className="text-sm text-gray-600">consultations</p>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Ce mois</h4>
                    <p className="text-3xl font-bold text-green-600">{stats.consultations_mois}</p>
                    <p className="text-sm text-gray-600">consultations</p>
                    </div>
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Rendez-vous</h4>
                    <p className="text-sm text-gray-600">En attente: <span className="font-semibold">{stats.rdv_en_attente}</span></p>
                    <p className="text-sm text-gray-600">Confirmés: <span className="font-semibold">{stats.rdv_confirmes}</span></p>
                    <p className="text-sm text-gray-600">Annulés: <span className="font-semibold">{stats.rdv_annules}</span></p>
                  </div>
                </div>

                  <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Capacité du centre</h4>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Capacité maximale</span>
                      <span className="text-sm font-semibold text-gray-900">{centre.capacite_max} patients</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${stats.taux_occupation}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stats.taux_occupation}% d'occupation</p>
					</div>
				</div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Médecins présents</h4>
                  {medecins.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {medecins.slice(0, 4).map((medecin) => (
                        <div key={medecin.id} className="flex flex-wrap gap-2 border rounded-lg p-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{medecin.nom} {medecin.prenom}</p>
                            <p className="text-sm text-gray-600">{medecin.specialite}</p>
                            <p className="text-xs text-gray-500">{medecin.patients_aujourdhui} patients aujourd'hui</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            medecin.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                            medecin.statut === 'en_consultation' ? 'bg-blue-100 text-blue-800' :
                            medecin.statut === 'pause' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {medecin.statut === 'disponible' ? 'Disponible' :
                             medecin.statut === 'en_consultation' ? 'En consultation' :
                             medecin.statut === 'pause' ? 'En pause' : 'Indisponible'}
                          </span>
                        </div>
                      ))}
                  </div>
                  ) : (
                    <p className="text-gray-600">Aucun médecin enregistré</p>
                  )}
                </div>
              </div>
            )}

            {/* Onglet Médecins */}
            {activeTab === 'medecins' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Médecins du centre</h4>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <UserPlus className="w-4 h-4" />
                    <span>Ajouter un médecin</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medecins.map((medecin) => (
						<motion.div 
                      key={medecin.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {medecin.prenom} {medecin.nom}
                          </h5>
                          <p className="text-sm text-gray-600">{medecin.specialite}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          medecin.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                          medecin.statut === 'en_consultation' ? 'bg-blue-100 text-blue-800' :
                          medecin.statut === 'pause' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {medecin.statut === 'disponible' ? 'Disponible' :
                           medecin.statut === 'en_consultation' ? 'En consultation' :
                           medecin.statut === 'pause' ? 'En pause' : 'Indisponible'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {medecin.patients_aujourdhui} patients
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
								</div>
            )}

            {/* Onglet Statistiques */}
            {activeTab === 'statistiques' && stats && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900">Statistiques du centre</h4>
                
                {/* Statistiques principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Consultations ce mois</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.consultations_mois}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">Consultations semaine</p>
                        <p className="text-2xl font-bold text-green-900">{stats.consultations_semaine}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">Consultations aujourd'hui</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.consultations_aujourdhui}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600">Taux d'occupation</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.taux_occupation}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Rendez-vous */}
                <div>
                  <h5 className="text-md font-semibold text-gray-900 mb-4">Rendez-vous</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">En attente</p>
                          <p className="text-3xl font-bold text-yellow-600">{stats.rdv_en_attente}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Confirmés</p>
                          <p className="text-3xl font-bold text-green-600">{stats.rdv_confirmes}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Annulés</p>
                          <p className="text-3xl font-bold text-red-600">{stats.rdv_annules}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personnel */}
                <div>
                  <h5 className="text-md font-semibold text-gray-900 mb-4">Personnel et Patients</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Médecins</p>
                          <p className="text-3xl font-bold text-blue-600">{stats.nombre_medecins}</p>
                        </div>
                        <Stethoscope className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Patients enregistrés</p>
                          <p className="text-3xl font-bold text-green-600">{stats.nombre_patients}</p>
                        </div>
                        <Users className="w-8 h-8 text-green-600" />
									</div>
									</div>
									</div>
									</div>
								</div>
            )}
          </div>
					</div>
				</div>
			</div>
  );
};

export default CentreDetail;