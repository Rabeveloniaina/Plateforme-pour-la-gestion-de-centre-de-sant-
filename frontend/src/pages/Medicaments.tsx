import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiServices } from '../lib/api'
import type { Medicament } from '../types'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { StatusBadge } from '../components/Table'
import { Search, Filter, Pill, Eye, Edit, Plus, AlertTriangle, CheckCircle, XCircle, Package, Calendar, Activity } from 'lucide-react'

export default function Medicaments() {
	const [medicaments, setMedicaments] = useState<Medicament[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [filters, setFilters] = useState({
		search: '',
		statut: '',
		forme: ''
	})

	const loadMedicaments = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (filters.search) params.append('search', filters.search)
			if (filters.statut) params.append('statut', filters.statut)
			if (filters.forme) params.append('forme_pharmaceutique', filters.forme)

			const response = await apiServices.medicaments.getAll(Object.fromEntries(params))
			setMedicaments(response.data || [])
		} catch (e: any) {
			setError(e.message || 'Erreur lors du chargement')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadMedicaments()
	}, [filters])

	const handleViewMedicament = (medicament: Medicament) => {
		setSelectedMedicament(medicament)
		setShowModal(true)
	}

	// Fonction pour obtenir le variant du statut
	const getStatusVariant = (statut: string) => {
		switch (statut?.toLowerCase()) {
			case 'actif': return 'success'
			case 'inactif': return 'error'
			case 'rupture': return 'warning'
			default: return 'warning'
		}
	}

	// Fonction pour obtenir l'icône du statut
	const getStatusIcon = (statut: string) => {
		switch (statut?.toLowerCase()) {
			case 'actif': return <CheckCircle size={14} />
			case 'inactif': return <XCircle size={14} />
			case 'rupture': return <AlertTriangle size={14} />
			default: return <AlertTriangle size={14} />
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
									Médicaments
								</h1>
								<p className="text-sm sm:text-base text-gray-600 mt-1">
									Gestion de la base de données des médicaments
								</p>
							</div>
							<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
								<div className="flex items-center space-x-3 px-3 py-2 bg-gray-100/50 rounded-xl">
									<Pill size={16} className="text-gray-500" />
									<span className="text-xs sm:text-sm font-medium text-gray-700">{medicaments.length} médicaments</span>
								</div>
								<div className="flex space-x-2">
									<Link 
										to="/medicaments/statistiques" 
										className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
									>
										<Activity size={14} className="mr-1" />
										Statistiques
									</Link>
									<Link 
										to="/medicaments/nouveau" 
										className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
									>
										<Plus size={16} className="mr-2" />
										<span className="font-medium">Nouveau médicament</span>
									</Link>
								</div>
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
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
					>
						<div className="relative">
							<Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								value={filters.search}
								onChange={(e) => setFilters({ ...filters, search: e.target.value })}
								placeholder="Nom commercial, DCI, fabricant..."
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
								<option value="actif">Actif</option>
								<option value="inactif">Inactif</option>
								<option value="rupture">En rupture</option>
							</select>
						</div>
						<div className="relative">
							<Package size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<select
								value={filters.forme}
								onChange={(e) => setFilters({ ...filters, forme: e.target.value })}
								className="appearance-none w-full pl-10 pr-8 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
							>
								<option value="">Toutes les formes</option>
								<option value="comprime">Comprimé</option>
								<option value="gelule">Gélule</option>
								<option value="sirop">Sirop</option>
								<option value="injection">Injection</option>
								<option value="pommade">Pommade</option>
								<option value="gouttes">Gouttes</option>
								<option value="suppositoire">Suppositoire</option>
								<option value="inhalateur">Inhalateur</option>
								<option value="patch">Patch</option>
								<option value="autre">Autre</option>
							</select>
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

					{/* Liste des médicaments */}
					{medicaments.length > 0 ? (
						<motion.div 
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
						>
							{medicaments.map((medicament) => (
								<Card 
									key={medicament.id_medicament} 
									className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer"
									onClick={() => handleViewMedicament(medicament)}
								>
									<div className="flex items-start justify-between mb-4">
										<div className="flex items-center space-x-3">
											<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
												<Pill size={20} className="text-white" />
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="text-sm font-semibold text-gray-900 truncate">
													{medicament.nom_commercial}
												</h3>
												<p className="text-xs text-gray-500 line-clamp-2">{medicament.dci}</p>
											</div>
										</div>
										<div className="flex items-center">
											{getStatusIcon(medicament.statut)}
											<StatusBadge 
												status={medicament.statut} 
												variant={getStatusVariant(medicament.statut)} 
											/>
										</div>
									</div>

									<div className="space-y-3 mb-4">
										<div className="flex items-center text-sm text-gray-600">
											<Package size={14} className="mr-2 text-gray-400" />
											{medicament.forme_pharmaceutique}
										</div>
										<div className="flex items-center text-sm text-gray-600">
											<Activity size={14} className="mr-2 text-gray-400" />
											{medicament.dosage}
										</div>
										{medicament.fabricant && (
											<div className="flex items-center text-sm text-gray-600">
												<Calendar size={14} className="mr-2 text-gray-400" />
												<span className="truncate">{medicament.fabricant}</span>
											</div>
										)}
										{medicament.prix_unitaire && (
											<div className="flex items-center text-sm text-gray-600">
												<span className="mr-2 text-gray-400">💰</span>
												<span className="font-semibold text-green-600">
													{medicament.prix_unitaire.toLocaleString('fr-FR')} FCFA
												</span>
											</div>
										)}
									</div>

									<div className="mt-4 pt-4 border-t border-gray-100">
										<div className="flex space-x-2">
											<button
												onClick={(e) => {
													e.stopPropagation()
													handleViewMedicament(medicament)
												}}
												className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium group-hover:bg-blue-100"
											>
												<Eye size={14} className="mr-1" />
												Voir détails
											</button>
											<Link
												to={`/medicaments/${medicament.id_medicament}/modifier`}
												onClick={(e) => e.stopPropagation()}
												className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
											>
												<Edit size={14} />
											</Link>
										</div>
									</div>
								</Card>
							))}
						</motion.div>
					) : (
						<EmptyState 
							title="Aucun médicament" 
							description="Aucun médicament ne correspond à vos critères de recherche."
							action={
								<Link 
									to="/medicaments/nouveau" 
									className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
								>
									<Plus size={16} className="mr-2" />
									Ajouter un médicament
								</Link>
							}
						/>
					)}

					{/* Modal détails médicament */}
					<Modal
						open={showModal}
						onClose={() => setShowModal(false)}
						title={selectedMedicament ? `💊 ${selectedMedicament.nom_commercial}` : ''}
					>
						{selectedMedicament && (
							<div className="space-y-6">
								<div className="flex items-center space-x-3">
									<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
										<Pill size={24} className="text-white" />
									</div>
									<div>
										<h3 className="text-lg font-semibold text-gray-900">{selectedMedicament.nom_commercial}</h3>
										<p className="text-sm text-gray-500">{selectedMedicament.dci}</p>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<h4 className="font-medium text-gray-900 mb-3">Informations générales</h4>
										<div className="space-y-3 text-sm">
											<div className="flex items-center">
												<Package size={16} className="mr-2 text-gray-400" />
												<span className="text-gray-600">Forme:</span>
												<span className="ml-2 font-medium">{selectedMedicament.forme_pharmaceutique}</span>
											</div>
											<div className="flex items-center">
												<Activity size={16} className="mr-2 text-gray-400" />
												<span className="text-gray-600">Dosage:</span>
												<span className="ml-2 font-medium">{selectedMedicament.dosage}</span>
											</div>
											{selectedMedicament.fabricant && (
												<div className="flex items-center">
													<Calendar size={16} className="mr-2 text-gray-400" />
													<span className="text-gray-600">Fabricant:</span>
													<span className="ml-2 font-medium">{selectedMedicament.fabricant}</span>
												</div>
											)}
											{selectedMedicament.prix_unitaire && (
												<div className="flex items-center">
													<span className="mr-2 text-gray-400">💰</span>
													<span className="text-gray-600">Prix:</span>
													<span className="ml-2 font-semibold text-green-600">
														{selectedMedicament.prix_unitaire.toLocaleString('fr-FR')} FCFA
													</span>
												</div>
											)}
										</div>
									</div>
									<div>
										<h4 className="font-medium text-gray-900 mb-3">Statut</h4>
										<div className="flex items-center">
											{getStatusIcon(selectedMedicament.statut)}
											<StatusBadge 
												status={selectedMedicament.statut} 
												variant={getStatusVariant(selectedMedicament.statut)} 
											/>
										</div>
									</div>
								</div>

								{selectedMedicament.contre_indications && (
									<div>
										<h4 className="font-medium text-gray-900 mb-2 flex items-center">
											<AlertTriangle size={16} className="mr-2 text-red-500" />
											Contre-indications
										</h4>
										<p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
											{selectedMedicament.contre_indications}
										</p>
									</div>
								)}

								{selectedMedicament.effets_secondaires && (
									<div>
										<h4 className="font-medium text-gray-900 mb-2 flex items-center">
											<XCircle size={16} className="mr-2 text-orange-500" />
											Effets secondaires
										</h4>
										<p className="text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
											{selectedMedicament.effets_secondaires}
										</p>
									</div>
								)}

								{selectedMedicament.interactions && (
									<div>
										<h4 className="font-medium text-gray-900 mb-2 flex items-center">
											<CheckCircle size={16} className="mr-2 text-blue-500" />
											Interactions
										</h4>
										<p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
											{selectedMedicament.interactions}
										</p>
									</div>
								)}

								<div className="flex gap-3 pt-4 border-t border-gray-200">
									<Link
										to={`/medicaments/${selectedMedicament.id_medicament}/modifier`}
										className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
										onClick={() => setShowModal(false)}
									>
										<Edit size={16} className="mr-2" />
										Modifier
									</Link>
									<button
										onClick={() => setShowModal(false)}
										className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
									>
										Fermer
									</button>
								</div>
							</div>
						)}
					</Modal>
				</div>
			</div>
		</Layout>
	)
}
