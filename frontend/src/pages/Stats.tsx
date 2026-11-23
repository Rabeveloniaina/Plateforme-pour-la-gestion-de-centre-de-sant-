import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import Layout from '../components/Layout'
import Card, { StatCard } from '../components/Card'
import { LineChart, DonutChart, BarChart } from '../components/Charts'
import { Download, FileText, BarChart3, TrendingUp, Calendar, MapPin, Users, Clock, CheckCircle } from 'lucide-react'
import { exportStatsCSV, exportStatsPDF } from '../utils/exportUtils'
import { useToast } from '../context/ToastContext'

export default function Stats() {
    const [centreStats, setCentreStats] = useState<any | null>(null)
    const [regionStats, setRegionStats] = useState<any[]>([])
    const [periode, setPeriode] = useState<'jour'|'semaine'|'mois'>('mois')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { showToast } = useToast()

    useEffect(() => {
        (async () => {
            setLoading(true)
            setError(null)
            try {
                const cs = await api.get<{ success: boolean; data: any }>(`/api/statistiques/centre?periode=${periode}`)
                setCentreStats((cs as any).data)
                const rs = await api.get<{ success: boolean; data: any[] }>(`/api/statistiques/region?periode=${periode}`)
                setRegionStats((rs as any).data || [])
            } catch (e: any) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        })()
    }, [periode])

    const downloadCSV = async () => {
        try {
            await exportStatsCSV('centre', periode);
            showToast('Export CSV réussi !', 'success');
        } catch (error: any) {
            showToast(error.message || 'Erreur lors de l\'export CSV', 'error');
        }
    };

    const downloadPDF = async () => {
        try {
            await exportStatsPDF('centre', periode);
            showToast('Export PDF réussi !', 'success');
        } catch (error: any) {
            showToast(error.message || 'Erreur lors de l\'export PDF', 'error');
        }
    };

    // Données pour les graphiques
    const chartData = {
        rdvEvolution: centreStats?.evolution_rdv || [],
        statutDistribution: [
            { label: 'Confirmés', value: centreStats?.nb_confirmes || 0, color: '#10B981' },
            { label: 'En attente', value: (centreStats?.nb_rdv || 0) - (centreStats?.nb_confirmes || 0) - (centreStats?.nb_annules || 0), color: '#F59E0B' },
            { label: 'Annulés', value: centreStats?.nb_annules || 0, color: '#EF4444' }
        ],
        regionPerformance: regionStats.map(r => ({
            label: r.region_nom,
            value: r.nb_rdv || 0,
            color: '#3B82F6'
        }))
    }

    return (
        <Layout>
            <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
                {/* Header moderne */}
                <div className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
                    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 gap-4"
                        >
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Statistiques
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 mt-1">
                                    Tableaux de bord et rapports pour le ministère
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100/50 rounded-xl">
                                    <BarChart3 size={16} className="text-gray-500" />
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">Période: {periode}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={downloadCSV}
                                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                                    >
                                        <Download size={14} className="mr-1" />
                                        CSV
                                    </button>
                                    <button 
                                        onClick={downloadPDF}
                                        className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                                    >
                                        <FileText size={14} className="mr-1" />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
                    {/* Filtres et contrôles */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8"
                    >
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select 
                                className="appearance-none pl-10 pr-8 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                value={periode} 
                                onChange={e => setPeriode(e.target.value as any)}
                            >
                                <option value="jour">Aujourd'hui</option>
                                <option value="semaine">Cette semaine</option>
                                <option value="mois">Ce mois</option>
                            </select>
                        </div>
                    </motion.div>
                    {/* Contenu principal */}
                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8"
                        >
                            <div className="flex items-center">
                                <div className="w-5 h-5 bg-red-500 rounded-full mr-3"></div>
                                <p className="text-red-800 font-medium">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {!loading && !error && (
                        <>
                            {/* Cartes de statistiques principales */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
                            >
                                <StatCard
                                    title="Total RDV"
                                    value={centreStats?.nb_rdv || '0'}
                                    icon={<Calendar size={24} />}
                                    color="blue"
                                    change={{ type: 'increase', value: '+12% vs mois dernier' }}
                                />
                                <StatCard
                                    title="Consultations"
                                    value={centreStats?.nb_consultations || '0'}
                                    icon={<Users size={24} />}
                                    color="green"
                                    change={{ type: 'increase', value: '+8% vs mois dernier' }}
                                />
                                <StatCard
                                    title="Confirmés"
                                    value={centreStats?.nb_confirmes || '0'}
                                    icon={<CheckCircle size={24} />}
                                    color="green"
                                    change={{ type: 'increase', value: '+15% vs mois dernier' }}
                                />
                                <StatCard
                                    title="Durée moyenne"
                                    value={`${centreStats?.duree_reelle_moy || '0'} min`}
                                    icon={<Clock size={24} />}
                                    color="purple"
                                    change={{ type: 'decrease', value: '-5% vs mois dernier' }}
                                />
                            </motion.div>

                            {/* Graphiques */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
                                {/* Évolution des RDV */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Card className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Évolution des RDV</h3>
                                            <TrendingUp size={20} className="text-blue-600" />
                                        </div>
                                        <LineChart 
                                            data={chartData.rdvEvolution} 
                                            height={300} 
                                            title="Évolution mensuelle des rendez-vous"
                                        />
                                    </Card>
                                </motion.div>

                                {/* Distribution des statuts */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Card className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-gray-900">Statuts des RDV</h3>
                                            <BarChart3 size={20} className="text-green-600" />
                                        </div>
                                        <DonutChart 
                                            data={chartData.statutDistribution} 
                                            size={250} 
                                            title="Répartition par statut"
                                        />
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Performance par région */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="mb-8"
                            >
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Performance par région</h3>
                                        <MapPin size={20} className="text-indigo-600" />
                                    </div>
                                    <BarChart 
                                        data={chartData.regionPerformance} 
                                        height={400}
                                        title="Performance par région"
                                    />
                                </Card>
                            </motion.div>

                            {/* Tableau détaillé des régions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <Card className="overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">Détails par région</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Région</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RDV</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Consultations</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durée moyenne</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Taux de réussite</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {regionStats.map((region, idx) => {
                                                    const tauxReussite = region.nb_rdv > 0 ? 
                                                        Math.round((region.nb_consultations / region.nb_rdv) * 100) : 0
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                                                        <MapPin size={14} className="text-white" />
                                                                    </div>
                                                                    <div className="ml-3">
                                                                        <div className="text-sm font-medium text-gray-900">{region.region_nom}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {region.nb_rdv || '—'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {region.nb_consultations || '—'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {region.duree_reelle_moy ? `${region.duree_reelle_moy} min` : '—'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                                        <div 
                                                                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${tauxReussite}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-sm text-gray-900">{tauxReussite}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    )
}


