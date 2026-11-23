import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Stethoscope, 
  Building2, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface StatistiquesData {
  totalCentres: number;
  totalMedecins: number;
  totalPatients: number;
  totalRDV: number;
  rdvAujourdhui: number;
  tauxOccupation: number;
  evolutionCentres: Array<{ mois: string; valeur: number }>;
  evolutionPatients: Array<{ mois: string; valeur: number }>;
  evolutionRDV: Array<{ mois: string; valeur: number }>;
  repartitionSpecialites: Array<{ specialite: string; nombre: number; pourcentage: number }>;
  repartitionRegions: Array<{ region: string; nombre: number; pourcentage: number }>;
  performanceCentres: Array<{ centre: string; consultations: number; satisfaction: number; occupation: number }>;
}

const Statistiques: React.FC = () => {
  const [data, setData] = useState<StatistiquesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('mois');
  const [selectedRegion, setSelectedRegion] = useState('tous');

  useEffect(() => {
    fetchStatistiques();
  }, [selectedPeriod, selectedRegion]);

  const fetchStatistiques = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Récupérer les statistiques du ministère
      const response = await apiFetch('/statistiques/ministere');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Données statistiques récupérées:', data);
      
      // Transformer les données de l'API vers le format attendu
      const statistiquesData: StatistiquesData = {
        totalCentres: data.data?.totalCentres || 0,
        totalMedecins: data.data?.totalMedecins || 0,
        totalPatients: data.data?.totalPatients || 0,
        totalRDV: data.data?.totalRDV || 0,
        rdvAujourdhui: data.data?.rdvAujourdhui || 0,
        tauxOccupation: data.data?.tauxOccupation || 0,
        evolutionCentres: data.data?.evolutionCentres || [],
        evolutionPatients: data.data?.evolutionPatients || [],
        evolutionRDV: data.data?.evolutionRDV || [],
        repartitionSpecialites: data.data?.repartitionSpecialites || [],
        repartitionRegions: data.data?.repartitionRegions || [],
        performanceCentres: data.data?.performanceCentres || []
      };
      
      setData(statistiquesData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // En cas d'erreur, afficher des données vides
      setData({
        totalCentres: 0,
        totalMedecins: 0,
        totalPatients: 0,
        totalRDV: 0,
        rdvAujourdhui: 0,
        tauxOccupation: 0,
        evolutionCentres: [],
        evolutionPatients: [],
        evolutionRDV: [],
        repartitionSpecialites: [],
        repartitionRegions: [],
        performanceCentres: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    console.log('Export des statistiques');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600">Impossible de charger les statistiques.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Statistiques du Système</h1>
              <p className="text-gray-600">Analyse des performances et tendances</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtres:</span>
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois</option>
                <option value="trimestre">Ce trimestre</option>
                <option value="annee">Cette année</option>
              </select>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tous">Toutes les régions</option>
                {/* TODO: Charger les vraies régions de Madagascar depuis l'API */}
              </select>
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Centres de Santé</p>
                <p className="text-3xl font-bold text-blue-600">{data.totalCentres}</p>
                {data.evolutionCentres && data.evolutionCentres.length > 1 && (
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Évolution ce mois
                  </p>
                )}
              </div>
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Médecins</p>
                <p className="text-3xl font-bold text-green-600">{data.totalMedecins}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5 ce mois
                </p>
              </div>
              <Stethoscope className="w-12 h-12 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patients</p>
                <p className="text-3xl font-bold text-purple-600">{data.totalPatients}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +150 ce mois
                </p>
              </div>
              <Users className="w-12 h-12 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rendez-vous</p>
                <p className="text-3xl font-bold text-orange-600">{data.totalRDV}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +500 ce mois
                </p>
              </div>
              <Calendar className="w-12 h-12 text-orange-600" />
            </div>
          </motion.div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Évolution des centres */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Évolution des Centres</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end space-x-2">
              {data.evolutionCentres.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(item.valeur / 15) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-2">{item.mois}</span>
                  <span className="text-xs font-medium text-gray-900">{item.valeur}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition des spécialités */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Répartition des Spécialités</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {data.repartitionSpecialites.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' :
                      index === 4 ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-700">{item.specialite}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{item.nombre}</span>
                    <span className="text-sm text-gray-500">({item.pourcentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance des centres */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance des Centres</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satisfaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux d'occupation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.performanceCentres.map((centre, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {centre.centre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {centre.consultations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <CheckCircle
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(centre.satisfaction)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{centre.satisfaction}/5</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${centre.occupation}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{centre.occupation}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Indicateurs de performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">RDV Aujourd'hui</h4>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{data.rdvAujourdhui}</div>
            <p className="text-sm text-gray-600">Rendez-vous programmés</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Taux d'Occupation</h4>
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{data.tauxOccupation}%</div>
            <p className="text-sm text-gray-600">Moyenne nationale</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Efficacité</h4>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">92%</div>
            <p className="text-sm text-gray-600">Taux de réussite</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;
