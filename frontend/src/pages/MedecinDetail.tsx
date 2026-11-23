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
  Stethoscope,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Play,
  Pause,
  Download,
  Plus
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

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
  taux_satisfaction: number;
  notes_administratives: string;
}

const MedecinDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [medecin, setMedecin] = useState<Medecin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

	useEffect(() => {
    fetchMedecinData();
  }, [id]);

  const fetchMedecinData = async () => {
    try {
      setLoading(true);
      
      const response = await apiFetch(`/medecins/${id}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Données médecin récupérées:', data);
      
      // Transformer les données de l'API vers le format attendu
      const medecinData: Medecin = {
        id: data.data?.id_medecin || parseInt(id || '1'),
        nom: data.data?.nom || '',
        prenom: data.data?.prenom || '',
        specialite: data.data?.specialite || 'Médecine générale',
        telephone: data.data?.telephone || '',
        email: data.data?.email || '',
        centre: data.data?.centre?.nom || 'Centre de Santé',
        statut: data.data?.statut || 'disponible',
        date_embauche: data.data?.date_embauche || new Date().toISOString().split('T')[0],
        horaires: data.data?.horaires || {
          debut: '08:00',
          fin: '17:00',
          jours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
        },
        patients_aujourdhui: data.data?.patients_aujourdhui || 0,
        consultations_totales: data.data?.consultations_totales || 0,
        taux_satisfaction: data.data?.taux_satisfaction || 0,
        notes_administratives: data.data?.notes_administratives || ''
      };
      
      setMedecin(medecinData);
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
          <p className="text-gray-600">Chargement des données du médecin...</p>
        </div>
      </div>
    );
  }

  if (!medecin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Médecin non trouvé</h2>
          <p className="text-gray-600 mb-4">Le médecin demandé n'existe pas.</p>
          <Link
            to="/medecins"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste</span>
          </Link>
			</div>
			</div>
    );
  }

	return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
							<div className="flex items-center space-x-4">
								<Link 
									to="/medecins" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
								>
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
								</Link>
									<div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {medecin.prenom} {medecin.nom}
										</h1>
                <p className="text-gray-600">{medecin.specialite} - {medecin.centre}</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								<Link
                to={`/medecins/${medecin.id}/modifier`}
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
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations personnelles</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{medecin.telephone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{medecin.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{medecin.centre}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations professionnelles</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Spécialité: {medecin.specialite}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Embauché le {new Date(medecin.date_embauche).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Taux de satisfaction: {medecin.taux_satisfaction}/5
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistiques</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Patients aujourd'hui: <span className="font-medium">{medecin.patients_aujourdhui}</span>
									</div>
                    <div className="text-sm text-gray-600">
                      Consultations totales: <span className="font-medium">{medecin.consultations_totales}</span>
									</div>
                    <div className="text-sm text-gray-600">
                      Horaires: {medecin.horaires.debut} - {medecin.horaires.fin}
										</div>
										</div>
								</div>
									</div>
									</div>
								</div>
					</div>
				</div>
			</div>
  );
};

export default MedecinDetail;