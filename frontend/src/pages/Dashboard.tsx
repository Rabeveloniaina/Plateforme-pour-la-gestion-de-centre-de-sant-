import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { parseLocalDate } from '../utils/dateFormatter'
import {
    Users, CalendarDays, FileText, Pill, Syringe, Clipboard,
    Activity, Heart, Shield, Clock,
    BarChart3, PieChart, ArrowUpRight, Eye,
    AlertCircle
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Card, { StatCard, ActionCard } from '../components/Card'
import { LineChart, DonutChart } from '../components/Charts'
import { StatusBadge, Avatar } from '../components/Table'
import AuthGuard from '../components/AuthGuard'

function DashboardContent() {
    const { user, isAuthenticated, token } = useAuth()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // const [nbRdvJour, setNbRdvJour] = useState<number | null>(null)
    const [centreStats, setCentreStats] = useState<{ nb_consultations?: number; nb_attente?: number; nb_confirmes?: number; nb_annules?: number; duree_reelle_moy?: number } | null>(null)
    const [regionStats, setRegionStats] = useState<Array<{ id_region: number; region_nom: string; nb_rdv: number; nb_consultations?: number; duree_reelle_moy?: number }>>([])
    const [centres, setCentres] = useState<Array<{ id_centre: number; nom: string }>>([])
    const [centreId, setCentreId] = useState<string>('')
    const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois'>('semaine')
    const [pendingToday, setPendingToday] = useState<any[]>([])

    // Nouvelles données médicales
    // const [fichesMedicales, setFichesMedicales] = useState<any[]>([])
    // const [prescriptionsActives, setPrescriptionsActives] = useState(0)
    // const [vaccinationsRecentes, setVaccinationsRecentes] = useState(0)
    // const [rappelsAVenir, setRappelsAVenir] = useState(0)

    useEffect(() => {
        if (!user || !isAuthenticated || !token) {
            setLoading(false)
            return
        }

        (async () => {
            try {
                // RDV du jour (compte simple via stats centre periode=jour)
                const qs = new URLSearchParams({ periode })
                if (centreId) qs.set('centre_id', centreId)
                const stats = await api.get<{ success: boolean; data: any }>(`/api/statistiques/centre?${qs.toString()}`)
                // setNbRdvJour(stats.data?.nb_rdv ?? null)
                setCentreStats(stats.data || {})

                // Stats par région (jour)
                const regions = await api.get<{ success: boolean; data: any[] }>(`/api/statistiques/region?periode=${periode}`)
                const top = (regions.data || []).sort((a, b) => (b.nb_rdv ?? 0) - (a.nb_rdv ?? 0)).slice(0, 5)
                setRegionStats(top)

                // RDV en attente aujourd'hui (simple fetch sur rendez-vous)
                const rdvParams = new URLSearchParams({ page: '1', limit: '5', statut: 'attente' })
                const base = centreId ? `${rdvParams.toString()}&centre_id=${centreId}` : rdvParams.toString()
                const enAttente = await api.get<{ success: boolean; data: any[] }>(`/api/rendez-vous?${base}`)
                setPendingToday(enAttente.data || [])

                // Nouvelles données médicales
                try {
                    // Fiches médicales récentes
                    // const fichesRes = await apiServices.fichesMedicales.getAll({ limit: '5', date_debut: new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0] })
                    // setFichesMedicales(fichesRes.data || [])

                    // Prescriptions actives (approximation)
                    // const prescriptionsRes = await apiServices.prescriptions.getAll({ statut: 'active', limit: '100' })
                    // setPrescriptionsActives(prescriptionsRes.data?.length || 0)

                    // Vaccinations récentes (7 derniers jours)
                    // const vaccinationsRes = await apiServices.vaccinations.getAll({ 
                    //     statut: 'administre', 
                    //     date_debut: new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0],
                    //     limit: '100'
                    // })
                    // setVaccinationsRecentes(vaccinationsRes.data?.length || 0)

                    // Rappels à venir
                    // const rappelsRes = await apiServices.vaccinations.getRappels()
                    // setRappelsAVenir(rappelsRes.data?.length || 0)
                } catch (medicalError) {
                    console.warn('Erreur chargement données médicales:', medicalError)
                }

            } catch (e: any) {
                setError(e.message || 'Erreur chargement statistiques')
            } finally {
                setLoading(false)
            }
        })()
    }, [user, isAuthenticated, centreId, periode])

    useEffect(() => {
        if (!isAuthenticated || !token) return

        (async () => {
            try {
                const res = await api.get<{ success: boolean; data: any[]; pagination?: any }>(`/api/centres?limit=100`)
                const list = (res as any).data?.map((c: any) => ({ id_centre: c.id_centre, nom: c.nom })) || []
                setCentres(list)
            } catch {
                // ignore if unauthorized; selector will be hidden if empty
            }
        })()
    }, [])

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement du tableau de bord...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
                {/* Header moderne avec gradient - Pleine largeur */}
                <div className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
                    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 gap-4">
                            <div className="flex-1">
                                <motion.h1
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                                >
                                    Tableau de bord
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1"
                                >
                                    Plateforme de Gestion des Centres de Santé
                                </motion.p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100/50 rounded-xl">
                                    <CalendarDays size={16} className="text-gray-500" />
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">15 Fév - 15 Août 2024</span>
                                </div>
                                <Link
                                    to="/stats"
                                    className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                                >
                                    <BarChart3 size={16} className="mr-2" />
                                    <span className="font-medium">Rapport</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
                    {/* Filtres modernes - Responsive */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8"
                    >
                        {centres.length > 0 && (
                            <div className="relative w-full sm:w-auto">
                                <select
                                    className="w-full appearance-none bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                                    value={centreId}
                                    onChange={e => setCentreId(e.target.value)}
                                >
                                    <option value="">Tous les centres</option>
                                    {centres.map(c => (
                                        <option key={c.id_centre} value={c.id_centre}>{c.nom}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="relative w-full sm:w-auto">
                            <select
                                className="w-full appearance-none bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                                value={periode}
                                onChange={e => setPeriode(e.target.value as any)}
                            >
                                <option value="jour">Aujourd'hui</option>
                                <option value="semaine">Cette semaine</option>
                                <option value="mois">Ce mois</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Cartes de statistiques principales - Responsive */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8"
                    >
                        <StatCard
                            title="Total consultations"
                            value={centreStats?.nb_consultations || 0}
                            change={{ value: "2.3% vs 3 mois", type: "increase" }}
                            icon={<Activity size={24} />}
                            color="blue"
                        />
                        <StatCard
                            title="Patients traités"
                            value={centreStats?.nb_confirmes || 0}
                            change={{ value: "1.7% vs 3 mois", type: "increase" }}
                            icon={<Users size={24} />}
                            color="green"
                        />
                        <StatCard
                            title="En attente"
                            value={centreStats?.nb_attente || 0}
                            change={{ value: "0.4% vs 3 mois", type: "decrease" }}
                            icon={<Clock size={24} />}
                            color="orange"
                        />
                        <StatCard
                            title="Taux de réussite"
                            value={`${centreStats?.nb_consultations && centreStats?.nb_confirmes
                                ? Math.round((centreStats.nb_confirmes / centreStats.nb_consultations) * 100)
                                : 0}%`}
                            change={{ value: "2.3% vs 3 mois", type: "increase" }}
                            icon={<Heart size={24} />}
                            color="purple"
                        />
                    </motion.div>

                    {/* Graphiques et visualisations - Responsive */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                        {/* Graphique des consultations */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900">Évolution des consultations</h3>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm text-gray-600">Consultations</span>
                                    </div>
                                </div>
                                <LineChart
                                    data={[4, 8, 6, 10, 7, 12, 9, 15, 11, 13, 8, 16]}
                                    labels={['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']}
                                    color="#3B82F6"
                                />
                            </Card>
                        </motion.div>

                        {/* Graphique en donut */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900">Répartition par spécialité</h3>
                                    <PieChart size={20} className="text-gray-400" />
                                </div>
                                <DonutChart
                                    data={[
                                        { label: 'Médecine générale', value: 45, color: '#3B82F6' },
                                        { label: 'Pédiatrie', value: 25, color: '#10B981' },
                                        { label: 'Cardiologie', value: 15, color: '#8B5CF6' },
                                        { label: 'Autres', value: 15, color: '#F59E0B' }
                                    ]}
                                />
                            </Card>
                        </motion.div>
                    </div>

                    {/* Accès rapides médicaux */}
                    {(user?.role === 'medecin' || user?.role === 'admin' || user?.role === 'personnel') && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="mb-8"
                        >
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">🏥 Fonctionnalités médicales</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                                <ActionCard
                                    title="Consultations"
                                    description="Dernières consultations"
                                    icon={<FileText size={24} />}
                                    color="blue"
                                    href="/fiches-medicales"
                                />
                                <ActionCard
                                    title="Prescriptions"
                                    description="Prescriptions actives"
                                    icon={<Clipboard size={24} />}
                                    color="green"
                                    href="/prescriptions"
                                />
                                <ActionCard
                                    title="Médicaments"
                                    description="Base de données"
                                    icon={<Pill size={24} />}
                                    color="purple"
                                    href="/medicaments"
                                />
                                <ActionCard
                                    title="Vaccinations"
                                    description="Carnet de vaccination"
                                    icon={<Syringe size={24} />}
                                    color="orange"
                                    href="/vaccinations"
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Tableaux de données modernes - Responsive */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
                        {/* Top régions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <Card className="overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold text-gray-900">Top régions par RDV</h3>
                                        <Link to="/centres" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                                            Voir centres
                                            <ArrowUpRight size={14} className="ml-1" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {regionStats.length === 0 ? (
                                        <div className="text-gray-500 text-sm text-center py-8">Aucune donnée régionale</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {regionStats.map((r, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{r.region_nom}</p>
                                                            <p className="text-sm text-gray-500">{r.nb_consultations || 0} consultations</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">{r.nb_rdv || 0}</p>
                                                        <p className="text-sm text-gray-500">RDV</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>

                        {/* RDV en attente */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Card className="overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-semibold text-gray-900">RDV en attente</h3>
                                        <Link to="/rendez-vous" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                                            Voir les RDV
                                            <ArrowUpRight size={14} className="ml-1" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {pendingToday.length === 0 ? (
                                        <div className="text-gray-500 text-sm text-center py-8">Aucun RDV en attente</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingToday.map((rv, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl">
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar name={`${rv.patient_nom} ${rv.patient_prenom}`} size="sm" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{rv.patient_nom} {rv.patient_prenom}</p>
                                                            <p className="text-sm text-gray-500">{rv.medecin_nom} • {parseLocalDate(rv.date_rdv)?.toLocaleTimeString() || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={rv.statut} variant="warning" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Centre sélectionné */}
                    {centreId && centres.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                        <Shield size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-600">Centre sélectionné</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {centres.find(c => String(c.id_centre) === String(centreId))?.nom || 'Centre inconnu'}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/centres"
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
                                >
                                    <Eye size={18} className="mr-2" />
                                    Voir le centre
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8"
                        >
                            <div className="flex items-center">
                                <AlertCircle size={20} className="text-red-500 mr-3" />
                                <p className="text-red-800 font-medium">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export default function Dashboard() {
    return (
        <AuthGuard>
            <DashboardContent />
        </AuthGuard>
    )
}