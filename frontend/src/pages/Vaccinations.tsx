import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiServices } from '../lib/api'
import type { Vaccination } from '../types'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { StatusBadge, Avatar } from '../components/Table'
import { Filter, Calendar, Syringe, Eye, Plus, User, Shield, Clock, CheckCircle, XCircle, AlertCircle, Activity } from 'lucide-react'

export default function Vaccinations() {
	const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
	const [rappels, setRappels] = useState<Vaccination[]>([])
	const [couvertureVaccinale, setCouvertureVaccinale] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	// const [selectedVaccination, setSelectedVaccination] = useState<Vaccination | null>(null)
	// const [showModal, setShowModal] = useState(false)
	const [activeTab, setActiveTab] = useState<'vaccinations' | 'rappels' | 'couverture'>('vaccinations')
	const [filters, setFilters] = useState({
		type_vaccin: '',
		statut: '',
		patient_search: '',
		date_debut: '',
		date_fin: ''
	})

	const loadData = async () => {
		setLoading(true)
		try {
			// Charger les vaccinations
			const params = new URLSearchParams()
			if (filters.type_vaccin) params.append('type_vaccin', filters.type_vaccin)
			if (filters.statut) params.append('statut', filters.statut)
			if (filters.patient_search) params.append('patient_search', filters.patient_search)
			if (filters.date_debut) params.append('date_debut', filters.date_debut)
			if (filters.date_fin) params.append('date_fin', filters.date_fin)

			const vaccinationsRes = await apiServices.vaccinations.getAll(Object.fromEntries(params))
			setVaccinations(vaccinationsRes.data || [])

			// Charger les rappels à venir
			const rappelsRes = await apiServices.vaccinations.getRappels()
			setRappels(rappelsRes.data || [])

			// Charger la couverture vaccinale
			const couvertureRes = await apiServices.vaccinations.getCouvertureVaccinale()
			setCouvertureVaccinale(couvertureRes.data || [])

		} catch (e: any) {
			setError(e.message || 'Erreur lors du chargement')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadData()
	}, [filters])

	// const handleViewVaccination = (vaccination: Vaccination) => {
	// 	setSelectedVaccination(vaccination)
	// 	setShowModal(true)
	// }

	const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR')

	const isRappelDu = (dateRappel: string | undefined) => {
		if (!dateRappel) return false
		const rappel = new Date(dateRappel)
		const aujourd = new Date()
		const diffTime = rappel.getTime() - aujourd.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		return diffDays <= 30 && diffDays >= 0
	}

	// Fonction pour obtenir le variant du statut
	const getStatusVariant = (statut: string) => {
		switch (statut?.toLowerCase()) {
			case 'administre': return 'success'
			case 'planifie': return 'warning'
			case 'reporte': return 'error'
			case 'annule': return 'error'
			default: return 'warning'
		}
	}

	// Fonction pour obtenir l'icône du statut
	const getStatusIcon = (statut: string) => {
		switch (statut?.toLowerCase()) {
			case 'administre': return <CheckCircle size={14} />
			case 'planifie': return <Clock size={14} />
			case 'reporte': return <XCircle size={14} />
			case 'annule': return <AlertCircle size={14} />
			default: return <Clock size={14} />
		}
	}

	// Fonction pour obtenir la couleur du type de vaccin
	const getTypeColor = (type: string) => {
		switch (type?.toLowerCase()) {
			case 'obligatoire': return 'text-red-600 bg-red-50'
			case 'recommande': return 'text-blue-600 bg-blue-50'
			case 'voyage': return 'text-purple-600 bg-purple-50'
			case 'professionnel': return 'text-orange-600 bg-orange-50'
			default: return 'text-gray-600 bg-gray-50'
		}
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
									Vaccinations
								</h1>
								<p className="text-sm sm:text-base text-gray-600 mt-1">
									Gestion du carnet de vaccination et couverture vaccinale
								</p>
							</div>
							<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
								<div className="flex items-center space-x-3 px-3 py-2 bg-gray-100/50 rounded-xl">
									<Syringe size={16} className="text-gray-500" />
									<span className="text-xs sm:text-sm font-medium text-gray-700">{(vaccinations || []).length} vaccinations</span>
								</div>
								<div className="flex space-x-2">
									<Link 
										to="/vaccinations/statistiques" 
										className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
									>
										<Activity size={14} className="mr-1" />
										Statistiques
									</Link>
									<Link 
										to="/vaccinations/nouvelle" 
										className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
									>
										<Plus size={16} className="mr-2" />
										<span className="font-medium">Nouvelle vaccination</span>
									</Link>
								</div>
							</div>
						</motion.div>
					</div>
				</div>

				<div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
					{/* Statistiques rapides */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
					>
						{[
							{ label: 'Administrées', count: (vaccinations || []).filter(v => v.statut === 'administre').length, color: 'text-green-600', bgColor: 'bg-green-50', icon: <CheckCircle size={20} className="text-green-600" /> },
							{ label: 'Planifiées', count: (vaccinations || []).filter(v => v.statut === 'planifie').length, color: 'text-blue-600', bgColor: 'bg-blue-50', icon: <Clock size={20} className="text-blue-600" /> },
							{ label: 'Rappels dus', count: (rappels || []).length, color: 'text-orange-600', bgColor: 'bg-orange-50', icon: <AlertCircle size={20} className="text-orange-600" /> },
							{ label: 'Reportées', count: (vaccinations || []).filter(v => v.statut === 'reporte').length, color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: <XCircle size={20} className="text-yellow-600" /> }
						].map((stat) => (
							<Card 
								key={stat.label}
								className={`p-4 sm:p-6 ${stat.bgColor} hover:shadow-lg transition-all duration-300`}
							>
								<div className="flex items-center justify-between">
									<div>
										<div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.count}</div>
										<div className="text-sm text-gray-600 mt-1">{stat.label}</div>
									</div>
									{stat.icon}
								</div>
							</Card>
						))}
					</motion.div>

					{/* Onglets modernes */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1 mb-6 sm:mb-8"
					>
						<nav className="flex space-x-1">
							{[
								{ key: 'vaccinations', label: 'Vaccinations', count: (vaccinations || []).length, icon: <Syringe size={16} /> },
								{ key: 'rappels', label: 'Rappels', count: (rappels || []).length, icon: <Clock size={16} /> },
								{ key: 'couverture', label: 'Couverture', count: null, icon: <Activity size={16} /> }
							].map(tab => (
								<button
									key={tab.key}
									onClick={() => setActiveTab(tab.key as any)}
									className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
										activeTab === tab.key
											? 'bg-blue-600 text-white shadow-lg'
											: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
									}`}
								>
									{tab.icon}
									<span className="ml-2">{tab.label}</span>
									{tab.count !== null && (
										<span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
											activeTab === tab.key
												? 'bg-white/20 text-white'
												: 'bg-gray-100 text-gray-700'
										}`}>
											{tab.count}
										</span>
									)}
								</button>
							))}
						</nav>
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

					{/* Contenu des onglets */}
					<motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
				
						{/* Onglet Vaccinations */}
						{activeTab === 'vaccinations' && (
							<div className="space-y-6">
								{/* Filtres modernes */}
								<motion.div 
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 }}
									className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8"
								>
									<div className="relative">
										<User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<input
											type="text"
											value={filters.patient_search}
											onChange={(e) => setFilters({ ...filters, patient_search: e.target.value })}
											placeholder="Nom du patient..."
											className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
										/>
									</div>
									<div className="relative">
										<Shield size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<select
											value={filters.type_vaccin}
											onChange={(e) => setFilters({ ...filters, type_vaccin: e.target.value })}
											className="appearance-none w-full pl-10 pr-8 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
										>
											<option value="">Tous les types</option>
											<option value="obligatoire">Obligatoire</option>
											<option value="recommande">Recommandé</option>
											<option value="voyage">Voyage</option>
											<option value="professionnel">Professionnel</option>
										</select>
									</div>
									<div className="relative">
										<Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<select
											value={filters.statut}
											onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
											className="appearance-none w-full pl-10 pr-8 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
										>
											<option value="">Tous les statuts</option>
											<option value="administre">Administré</option>
											<option value="planifie">Planifié</option>
											<option value="reporte">Reporté</option>
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

								{/* Liste des vaccinations */}
								{(vaccinations || []).length > 0 ? (
									<motion.div 
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.5 }}
										className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
									>
										{(vaccinations || []).map((vaccination) => (
											<Card 
												key={vaccination.id_vaccination} 
												className={`p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer ${
													isRappelDu(vaccination.date_rappel) ? 'border-l-4 border-orange-400' : ''
												}`}
												onClick={() => {
													// Navigation vers détails vaccination
													window.location.href = `/vaccinations/${vaccination.id_vaccination}`
												}}
											>
												<div className="flex items-start justify-between mb-4">
													<div className="flex items-center space-x-3">
														<Avatar name={vaccination.nom_vaccin || 'Vaccin'} size="md" />
														<div className="flex-1 min-w-0">
															<h3 className="text-sm font-semibold text-gray-900 truncate">
																{vaccination.nom_vaccin}
															</h3>
															<p className="text-xs text-gray-500">Vaccin</p>
														</div>
													</div>
													<div className="flex items-center space-x-2">
														{getStatusIcon(vaccination.statut)}
														<StatusBadge 
															status={vaccination.statut} 
															variant={getStatusVariant(vaccination.statut)} 
														/>
														{isRappelDu(vaccination.date_rappel) && (
															<span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
																⚠️ Rappel dû
															</span>
														)}
													</div>
												</div>

												<div className="space-y-3 mb-4">
													<div className="flex items-center text-sm text-gray-600">
														<User size={14} className="mr-2 text-gray-400" />
														{vaccination.patient_nom || 'Patient'}
													</div>
													<div className="flex items-center text-sm text-gray-600">
														<Calendar size={14} className="mr-2 text-gray-400" />
														{formatDate(vaccination.date_administration)}
													</div>
													<div className="flex items-center text-sm text-gray-600">
														<Shield size={14} className="mr-2 text-gray-400" />
														<span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(vaccination.type_vaccin)}`}>
															{vaccination.type_vaccin}
														</span>
													</div>
													{vaccination.date_rappel && (
														<div className="flex items-center text-sm text-gray-600">
															<Clock size={14} className="mr-2 text-gray-400" />
															Rappel: {formatDate(vaccination.date_rappel)}
														</div>
													)}
												</div>

												{/* Détails de la vaccination */}
												<div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
													{vaccination.lot_vaccin && (
														<div className="text-center">
															<div className="text-sm font-semibold text-blue-600">{vaccination.lot_vaccin}</div>
															<div className="text-xs text-gray-500">Lot</div>
														</div>
													)}
													{vaccination.fabricant && (
														<div className="text-center">
															<div className="text-sm font-semibold text-green-600 truncate">{vaccination.fabricant}</div>
															<div className="text-xs text-gray-500">Fabricant</div>
														</div>
													)}
													{vaccination.site_injection && (
														<div className="text-center">
															<div className="text-sm font-semibold text-purple-600">{vaccination.site_injection}</div>
															<div className="text-xs text-gray-500">Site</div>
														</div>
													)}
													{vaccination.reactions_adverses && (
														<div className="text-center">
															<div className="text-sm font-semibold text-red-600">⚠️</div>
															<div className="text-xs text-gray-500">Réactions</div>
														</div>
													)}
												</div>

												<div className="mt-4 pt-4 border-t border-gray-100">
													<div className="flex space-x-2">
														<button 
															onClick={(e) => {
																e.stopPropagation()
																// handleViewVaccination(vaccination)
															}}
															className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium group-hover:bg-blue-100"
														>
															<Eye size={14} className="mr-1" />
															Voir
														</button>
														{vaccination.statut === 'planifie' && (
															<Link
																to={`/vaccinations/${vaccination.id_vaccination}/administrer`}
																onClick={(e) => e.stopPropagation()}
																className="inline-flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200"
															>
																<Syringe size={14} />
															</Link>
														)}
													</div>
												</div>
											</Card>
										))}
									</motion.div>
								) : (
									<EmptyState 
										title="Aucune vaccination" 
										description="Aucune vaccination ne correspond à vos critères de recherche."
										action={
											<Link 
												to="/vaccinations/nouvelle" 
												className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
											>
												<Plus size={16} className="mr-2" />
												Nouvelle vaccination
											</Link>
										}
									/>
								)}
							</div>
						)}

						{/* Onglet Rappels */}
						{activeTab === 'rappels' && (
							<div className="space-y-6">
								<motion.div 
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 }}
									className="bg-orange-50 border border-orange-200 rounded-xl p-6"
								>
									<div className="flex items-center">
										<AlertCircle size={20} className="text-orange-600 mr-3" />
										<p className="text-orange-800 font-medium">
											<strong>{(rappels || []).length} rappel(s)</strong> à effectuer dans les 30 prochains jours
										</p>
									</div>
								</motion.div>

								{(rappels || []).length > 0 ? (
									<motion.div 
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.5 }}
										className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
									>
										{(rappels || []).map((rappel) => (
											<Card 
												key={rappel.id_vaccination} 
												className="p-4 sm:p-6 border-l-4 border-orange-400 hover:shadow-lg transition-all duration-300"
											>
												<div className="flex items-start justify-between mb-4">
													<div className="flex items-center space-x-3">
														<Avatar name={rappel.nom_vaccin || 'Vaccin'} size="md" />
														<div className="flex-1 min-w-0">
															<h3 className="text-sm font-semibold text-gray-900 truncate">
																{rappel.nom_vaccin}
															</h3>
															<p className="text-xs text-gray-500">Rappel dû</p>
														</div>
													</div>
													<div className="flex items-center space-x-2">
														<AlertCircle size={16} className="text-orange-600" />
														<span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
															Urgent
														</span>
													</div>
												</div>

												<div className="space-y-3 mb-4">
													<div className="flex items-center text-sm text-gray-600">
														<User size={14} className="mr-2 text-gray-400" />
														{rappel.patient_nom || 'Patient'}
													</div>
													<div className="flex items-center text-sm text-gray-600">
														<Calendar size={14} className="mr-2 text-gray-400" />
														Rappel: {formatDate(rappel.date_rappel!)}
													</div>
													<div className="flex items-center text-sm text-gray-600">
														<Clock size={14} className="mr-2 text-gray-400" />
														Initiale: {formatDate(rappel.date_administration)}
													</div>
													<div className="flex items-center text-sm text-gray-600">
														<Shield size={14} className="mr-2 text-gray-400" />
														<span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(rappel.type_vaccin)}`}>
															{rappel.type_vaccin}
														</span>
													</div>
												</div>

												<div className="mt-4 pt-4 border-t border-gray-100">
													<div className="flex space-x-2">
														<Link
															to={`/vaccinations/${rappel.id_vaccination}/rappel`}
															className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors duration-200 text-sm font-medium"
														>
															<Syringe size={14} className="mr-1" />
															Planifier rappel
														</Link>
														<button
															onClick={() => {
																// Navigation vers détails vaccination
																window.location.href = `/vaccinations/${rappel.id_vaccination}`
															}}
															className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
															title="Voir détails"
														>
															<Eye size={14} />
														</button>
													</div>
												</div>
											</Card>
										))}
									</motion.div>
								) : (
									<EmptyState 
										title="Aucun rappel à venir" 
										description="Tous les rappels sont à jour pour les 30 prochains jours."
									/>
								)}
							</div>
						)}

						{/* Onglet Couverture vaccinale */}
						{activeTab === 'couverture' && (
							<div className="space-y-6">
								<motion.div 
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.4 }}
									className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
								>
									<div className="flex items-center mb-6">
										<Activity size={20} className="text-blue-600 mr-3" />
										<h3 className="text-lg font-semibold text-gray-900">Couverture vaccinale par vaccin</h3>
									</div>
									
									{(couvertureVaccinale || []).length > 0 ? (
										<div className="space-y-4">
											{(couvertureVaccinale || []).map((vaccin, index) => (
												<motion.div 
													key={vaccin.nom_vaccin}
													className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors duration-200"
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.2, delay: index * 0.1 }}
												>
													<div className="flex items-center space-x-3">
														<Shield size={20} className="text-blue-600" />
														<div>
															<h4 className="font-medium text-gray-900">{vaccin.nom_vaccin}</h4>
															<p className="text-sm text-gray-600">
																{vaccin.patients_vaccines} patients vaccinés sur {vaccin.total_patients}
															</p>
														</div>
													</div>
													<div className="text-right">
														<div className={`text-2xl font-bold ${
															vaccin.taux_couverture >= 80 ? 'text-green-600' :
															vaccin.taux_couverture >= 60 ? 'text-yellow-600' :
															'text-red-600'
														}`}>
															{vaccin.taux_couverture}%
														</div>
														<div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
															<div 
																className={`h-2 rounded-full transition-all duration-500 ${
																	vaccin.taux_couverture >= 80 ? 'bg-green-500' :
																	vaccin.taux_couverture >= 60 ? 'bg-yellow-500' :
																	'bg-red-500'
																}`}
																style={{ width: `${vaccin.taux_couverture}%` }}
															/>
														</div>
													</div>
												</motion.div>
											))}
										</div>
									) : (
										<EmptyState 
											title="Aucune donnée de couverture" 
											description="Aucune donnée de couverture vaccinale disponible."
										/>
									)}
								</motion.div>
							</div>
						)}
					</motion.div>
				</div>
			</div>
		</Layout>
	)
}
