import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiServices } from '../lib/api'
import type { FicheMedicale } from '../types'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { StatusBadge, Avatar } from '../components/Table'
import { Search, Filter, Calendar, Stethoscope, Eye, Edit, Plus, FileText, Heart, Thermometer, Weight, Activity, Clock, AlertCircle } from 'lucide-react'

export default function FichesMedicales() {
	const [fiches, setFiches] = useState<FicheMedicale[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filters, setFilters] = useState({
		statut: '',
		date_debut: '',
		date_fin: '',
		search: ''
	})

	const loadFiches = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (filters.statut) params.append('statut', filters.statut)
			if (filters.date_debut) params.append('date_debut', filters.date_debut)
			if (filters.date_fin) params.append('date_fin', filters.date_fin)
			if (filters.search) params.append('search', filters.search)

			const response = await apiServices.fichesMedicales.getAll(Object.fromEntries(params))
			setFiches(response.data || [])
		} catch (e: any) {
			setError(e.message || 'Erreur lors du chargement')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadFiches()
	}, [filters])

	const formatDateTime = (date: string) => new Date(date).toLocaleString('fr-FR')

	// Fonction pour obtenir le variant du statut
	const getStatusVariant = (statut: string) => {
		const s = statut?.toLowerCase() || ''
		if (s.includes('termine') || s.includes('terminé')) return 'success'
		if (s.includes('annule') || s.includes('annulé')) return 'error'
		if (s.includes('brouillon')) return 'warning'
		return 'warning'
	}

	// Fonction pour obtenir l'icône du statut
	const getStatusIcon = (statut: string) => {
		const s = statut?.toLowerCase() || ''
		if (s.includes('termine') || s.includes('terminé')) return <FileText size={14} />
		if (s.includes('annule') || s.includes('annulé')) return <AlertCircle size={14} />
		if (s.includes('brouillon')) return <Edit size={14} />
		return <Clock size={14} />
	}

	if (loading) return <Loader />

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
									Fiches Médicales
								</h1>
								<p className="text-sm sm:text-base text-gray-600 mt-1">
									Gestion des consultations et dossiers médicaux
								</p>
							</div>
							<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
								<div className="flex items-center space-x-3 px-3 py-2 bg-gray-100/50 rounded-xl">
									<FileText size={16} className="text-gray-500" />
									<span className="text-xs sm:text-sm font-medium text-gray-700">{fiches.length} fiches</span>
								</div>
								<Link 
									to="/fiches-medicales/nouvelle" 
									className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
								>
									<Plus size={16} className="mr-2" />
									<span className="font-medium">Nouvelle consultation</span>
								</Link>
							</div>
						</motion.div>
					</div>
				</div>

				<div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">

					{/* Filtres modernes */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
					>
						<div className="relative">
							<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								value={filters.search}
								onChange={(e) => setFilters({ ...filters, search: e.target.value })}
								placeholder="Patient, médecin, diagnostic..."
								className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
							/>
						</div>
						<div className="relative">
							<Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<select
								value={filters.statut}
								onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
								className="appearance-none w-full pl-10 pr-8 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
							>
								<option value="">Tous les statuts</option>
								<option value="brouillon">Brouillon</option>
								<option value="termine">Terminé</option>
								<option value="annule">Annulé</option>
							</select>
						</div>
						<div className="relative">
							<Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<input
								type="date"
								value={filters.date_debut}
								onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })}
								className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
							/>
						</div>
						<div className="relative">
							<Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<input
								type="date"
								value={filters.date_fin}
								onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
								className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
							/>
						</div>
					</motion.div>

					{/* Contenu principal */}
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

					{/* Liste des fiches */}
					{fiches.length > 0 ? (
						<motion.div 
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
						>
							{fiches.map((fiche) => (
								<Card 
									key={fiche.id_fiche} 
									className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group"
								>
									<div className="flex items-start justify-between mb-4">
										<div className="flex items-center space-x-3">
											<Avatar name={`${fiche.patient_nom} ${fiche.patient_prenom}`} size="md" />
											<div className="flex-1 min-w-0">
												<h3 className="text-sm font-semibold text-gray-900 truncate">
													{fiche.patient_nom} {fiche.patient_prenom}
												</h3>
												<p className="text-xs text-gray-500">Patient</p>
											</div>
										</div>
										<div className="flex items-center">
											{getStatusIcon(fiche.statut)}
											<StatusBadge 
												status={fiche.statut} 
												variant={getStatusVariant(fiche.statut)} 
											/>
										</div>
									</div>
									
									<div className="space-y-3 mb-4">
										<div className="flex items-center text-sm text-gray-600">
											<Calendar size={14} className="mr-2 text-gray-400" />
											{formatDateTime(fiche.date_consultation)}
										</div>
										<div className="flex items-center text-sm text-gray-600">
											<Stethoscope size={14} className="mr-2 text-gray-400" />
											Dr. {fiche.medecin_nom} {fiche.medecin_prenom}
										</div>
										{fiche.diagnostic_principal && (
											<div className="flex items-start text-sm text-gray-600">
												<FileText size={14} className="mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
												<span className="line-clamp-2">{fiche.diagnostic_principal}</span>
											</div>
										)}
									</div>

									{/* Données vitales en aperçu */}
									<div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
										{fiche.poids && (
											<div className="flex items-center space-x-2">
												<Weight size={14} className="text-blue-500" />
												<div>
													<div className="text-sm font-semibold text-blue-600">{fiche.poids} kg</div>
													<div className="text-xs text-gray-500">Poids</div>
												</div>
											</div>
										)}
										{fiche.taille && (
											<div className="flex items-center space-x-2">
												<Activity size={14} className="text-green-500" />
												<div>
													<div className="text-sm font-semibold text-green-600">{fiche.taille} cm</div>
													<div className="text-xs text-gray-500">Taille</div>
												</div>
											</div>
										)}
										{fiche.tension_systolique && fiche.tension_diastolique && (
											<div className="flex items-center space-x-2">
												<Heart size={14} className="text-red-500" />
												<div>
													<div className="text-sm font-semibold text-red-600">
														{fiche.tension_systolique}/{fiche.tension_diastolique}
													</div>
													<div className="text-xs text-gray-500">Tension</div>
												</div>
											</div>
										)}
										{fiche.temperature && (
											<div className="flex items-center space-x-2">
												<Thermometer size={14} className="text-orange-500" />
												<div>
													<div className="text-sm font-semibold text-orange-600">{fiche.temperature}°C</div>
													<div className="text-xs text-gray-500">Température</div>
												</div>
											</div>
										)}
									</div>
									
									<div className="mt-4 pt-4 border-t border-gray-100">
										<div className="flex space-x-2">
											<Link 
												to={`/fiches-medicales/${fiche.id_fiche}`}
												className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium group-hover:bg-blue-100"
											>
												<Eye size={14} className="mr-1" />
												Voir détails
											</Link>
											{fiche.statut === 'brouillon' && (
												<Link 
													to={`/fiches-medicales/${fiche.id_fiche}/modifier`}
													className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
												>
													<Edit size={14} />
												</Link>
											)}
										</div>
									</div>
								</Card>
							))}
						</motion.div>
					) : (
						<EmptyState 
							title="Aucune fiche médicale" 
							description="Aucune consultation ne correspond à vos critères de recherche."
							action={
								<Link 
									to="/fiches-medicales/nouvelle" 
									className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
								>
									<Plus size={16} className="mr-2" />
									Créer une consultation
								</Link>
							}
						/>
					)}

					{/* Pagination moderne */}
					{fiches.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
							className="flex justify-center mt-8"
						>
							<nav className="flex items-center space-x-2">
								<button 
									className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
									disabled
								>
									← Précédent
								</button>
								<span className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
									Page 1 sur 1
								</span>
								<button 
									className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
									disabled
								>
									Suivant →
								</button>
							</nav>
						</motion.div>
					)}
				</div>
			</div>
		</Layout>
	)
}
