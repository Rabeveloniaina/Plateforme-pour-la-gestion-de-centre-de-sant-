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
  User,
  Heart,
  FileText,
  Pill,
  Syringe,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Plus
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
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
  allergies: string[];
  maladies_chroniques: string[];
  statut: 'actif' | 'inactif';
  date_inscription: string;
  derniere_consultation: string;
  medecin_traitant: string;
  notes_medicales: string;
}

interface RendezVous {
  id: number;
  date: string;
  heure: string;
  medecin: string;
  specialite: string;
  motif: string;
  statut: 'confirme' | 'en_attente' | 'termine' | 'annule';
}

interface FicheMedicale {
  id: number;
  date: string;
  medecin: string;
  diagnostic: string;
  traitement: string;
  observations: string;
}

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [rdv, setRdv] = useState<RendezVous[]>([]);
  const [fiches, setFiches] = useState<FicheMedicale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

	useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      const response = await api.get<{success: boolean; data: any}>(`/patients/${id}`);
      const patientData = response.data;
      
      // Parser les champs JSON si nécessaire
      const parseJsonField = (field: any): string[] => {
        if (Array.isArray(field)) return field;
        if (typeof field === 'string' && field) {
          try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };
      
      const parsedPatient: Patient = {
        ...patientData,
        allergies: parseJsonField(patientData.allergies),
        maladies_chroniques: parseJsonField(patientData.maladies_chroniques)
      };
      
      setPatient(parsedPatient);
      try {
        const rdvResponse = await api.get<{success: boolean; data: RendezVous[]}>(`/rendez-vous?patient_id=${id}`);
        setRdv(rdvResponse.data || []);
      } catch {}
      try {
        const fichesResponse = await api.get<{success: boolean; data: FicheMedicale[]}>(`/fiches-medicales?patient_id=${id}`);
        setFiches(fichesResponse.data || []);
      } catch {}
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
		} finally { 
      setLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!patient) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) return;
    try {
      await api.delete(`/patients/${patient.id}`);
      window.location.href = '/patients';
    } catch (e) {
      console.error('Erreur lors de la suppression du patient:', e);
    }
  };

  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données du patient...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient non trouvé</h2>
          <p className="text-gray-600 mb-4">Le patient demandé n'existe pas.</p>
          <Link
            to="/patients"
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
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'rdv', label: 'Rendez-vous', icon: Calendar },
    { id: 'fiches', label: 'Fiches médicales', icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'vaccinations', label: 'Vaccinations', icon: Syringe },
  ];

	return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
							<div className="flex items-center space-x-4">
								<Link 
									to="/patients" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
								>
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
								</Link>
						<div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.prenom} {patient.nom}
										</h1>
                <p className="text-gray-600">Détail du patient</p>
									</div>
								</div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDeletePatient}
                className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
							<Link 
                to={`/patients/${patient.id}/modifier`}
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
                <span className="text-2xl font-bold text-blue-600">
                  {patient.prenom?.[0] || '?'}{patient.nom?.[0] || '?'}
                </span>
					</div>
				</div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations personnelles</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {calculateAge(patient.date_naissance)} ans (né le {new Date(patient.date_naissance).toLocaleDateString('fr-FR')})
                      </span>
									</div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{patient.telephone}</span>
									</div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{patient.email}</span>
									</div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{patient.adresse}</span>
									</div>
									</div>
								</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations médicales</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Groupe sanguin: {patient.groupe_sanguin}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Médecin traitant: {patient.medecin_traitant}</span>
									</div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Statut: {patient.statut === 'actif' ? 'Actif' : 'Inactif'}</span>
							</div>
						</div>
									</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Allergies & Maladies</h3>
                  <div className="space-y-2">
						<div>
                      <span className="text-sm font-medium text-gray-600">Allergies:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.allergies.map((allergie, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {allergie}
                          </span>
                        ))}
							</div>
						</div>
						<div>
                      <span className="text-sm font-medium text-gray-600">Maladies chroniques:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.maladies_chroniques.map((maladie, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {maladie}
                          </span>
                        ))}
                      </div>
                    </div>
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
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">Rendez-vous à venir</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {rdv.filter(r => r.statut === 'confirme' || r.statut === 'en_attente').length}
                        </p>
											</div>
                      <Calendar className="w-8 h-8 text-blue-600" />
							</div>
						</div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
													<div>
                        <p className="text-sm text-green-600">Fiches médicales</p>
                        <p className="text-2xl font-bold text-green-900">{fiches.length}</p>
							</div>
                      <FileText className="w-8 h-8 text-green-600" />
						</div>
											</div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
											<div>
                        <p className="text-sm text-purple-600">Dernière consultation</p>
                        <p className="text-sm font-bold text-purple-900">
                          {patient.derniere_consultation ? 
                            new Date(patient.derniere_consultation).toLocaleDateString('fr-FR') : 
                            'Jamais'
                          }
																</p>
															</div>
                      <Clock className="w-8 h-8 text-purple-600" />
														</div>
											</div>
										</div>

											<div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Notes médicales</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{patient.notes_medicales}</p>
                  </div>
																	</div>
																	</div>
																)}

            {/* Onglet Rendez-vous */}
            {activeTab === 'rdv' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Rendez-vous</h4>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    <span>Nouveau RDV</span>
                  </button>
																	</div>
                <div className="space-y-4">
                  {rdv.map((rdvItem) => (
                    <motion.div
                      key={rdvItem.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
																	</div>
                        <div>
                          <h5 className="font-medium text-gray-900">{rdvItem.medecin}</h5>
                          <p className="text-sm text-gray-600">{rdvItem.specialite}</p>
                          <p className="text-sm text-gray-500">{rdvItem.motif}</p>
												</div>
											</div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{rdvItem.date}</p>
                          <p className="text-sm text-gray-600">{rdvItem.heure}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rdvItem.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                            rdvItem.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                            rdvItem.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {rdvItem.statut === 'confirme' ? 'Confirmé' :
                             rdvItem.statut === 'en_attente' ? 'En attente' :
                             rdvItem.statut === 'termine' ? 'Terminé' : 'Annulé'}
                          </span>
																		</div>
																	</div>
                    </motion.div>
                  ))}
																		</div>
																	</div>
													)}

            {/* Onglet Fiches médicales */}
            {activeTab === 'fiches' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Fiches médicales</h4>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Plus className="w-4 h-4" />
                    <span>Nouvelle fiche</span>
                  </button>
												</div>
                <div className="space-y-4">
                  {fiches.map((fiche) => (
                    <motion.div
                      key={fiche.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h5 className="font-medium text-gray-900">{fiche.medecin}</h5>
                            <span className="text-sm text-gray-500">{new Date(fiche.date).toLocaleDateString('fr-FR')}</span>
											</div>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Diagnostic:</span> {fiche.diagnostic}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Traitement:</span> {fiche.traitement}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Observations:</span> {fiche.observations}
                          </p>
										</div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="w-4 h-4" />
                        </button>
											</div>
                    </motion.div>
											))}
								</div>
					</div>
				)}

				{/* Onglet Prescriptions */}
				{activeTab === 'prescriptions' && (
              <div className="text-center py-8">
                <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Gestion des prescriptions</p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Voir les prescriptions
                </button>
					</div>
				)}

				{/* Onglet Vaccinations */}
				{activeTab === 'vaccinations' && (
              <div className="text-center py-8">
                <Syringe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Carnet de vaccination</p>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Voir les vaccinations
                </button>
											</div>
										)}
									</div>
		</div>
				</div>
			</div>
  );
};

export default PatientDetail;