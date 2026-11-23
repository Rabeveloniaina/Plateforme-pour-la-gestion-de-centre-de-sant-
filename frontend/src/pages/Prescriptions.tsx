import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiServices } from '../lib/api'
import type { Prescription } from '../types'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { StatusBadge, Avatar } from '../components/Table'
import { Filter, Calendar, FileText, Eye, Plus, User, Pill, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Prescriptions() {
	const { user } = useAuth()
	const isPatient = user?.role === 'patient'
	const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [showRenouvelerModal, setShowRenouvelerModal] = useState(false)
	const [renouvelerData, setRenouvelerData] = useState({ nouvelle_duree: '', nouvelle_quantite: '', date_debut: '' })
	const [renouvelerLoading, setRenouvelerLoading] = useState(false)
	const [filters, setFilters] = useState({
		statut: '',
		patient_search: '',
		medicament_search: '',
		date_debut: '',
		date_fin: ''
	})

	const loadPrescriptions = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (filters.statut) params.append('statut', filters.statut)
			if (filters.medicament_search) params.append('medicament', filters.medicament_search)
			if (filters.date_debut) params.append('date_debut', filters.date_debut)
			if (filters.date_fin) params.append('date_fin', filters.date_fin)

			// Si c'est un patient, utiliser getMyPrescriptions, sinon getAll
			const response = isPatient 
				? await apiServices.prescriptions.getMyPrescriptions(Object.fromEntries(params))
				: await apiServices.prescriptions.getAll(Object.fromEntries(params))
			setPrescriptions(Array.isArray(response.data) ? response.data : [])
			setError(null)
		} catch (e: any) {
			setError(e.message || 'Erreur lors du chargement')
			setPrescriptions([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadPrescriptions()
	}, [filters])

	const handleViewPrescription = (prescription: Prescription) => {
		setSelectedPrescription(prescription)
		setShowModal(true)
	}

	const handleRenouveler = (prescription: Prescription) => {
		setSelectedPrescription(prescription)
		setRenouvelerData({
			nouvelle_duree: prescription.duree_traitement.toString(),
			nouvelle_quantite: prescription.quantite_totale.toString(),
			date_debut: new Date().toISOString().split('T')[0]
		})
		setShowRenouvelerModal(true)
	}

	const handleRenouvelerSubmit = async () => {
		if (!selectedPrescription) return
		setRenouvelerLoading(true)
		try {
			const response = await apiServices.prescriptions.renouveler(
				selectedPrescription.id_prescription,
				{
					nouvelle_duree: parseInt(renouvelerData.nouvelle_duree),
					nouvelle_quantite: parseInt(renouvelerData.nouvelle_quantite),
					date_debut: renouvelerData.date_debut
				}
			)
			if (response.success) {
				alert('Prescription renouvelée avec succès!')
				setShowRenouvelerModal(false)
				loadPrescriptions()
			}
		} catch (e: any) {
			alert('Erreur lors du renouvellement: ' + (e.message || 'Erreur inconnue'))
		} finally {
			setRenouvelerLoading(false)
		}
	}

	const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR')

	const isExpiringSoon = (dateFin: string) => {
		if (!dateFin) return false
		const fin = new Date(dateFin)
		const aujourd = new Date()
		const diffTime = fin.getTime() - aujourd.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		return diffDays <= 7 && diffDays > 0
	}

	if (loading) return <Loader />

	// Fonction pour obtenir le variant du statut
	const getStatusVariant = (statut: string) => {
		switch (statut?.toLowerCase()) {
			case 'active': return 'success'
			case 'terminee': return 'warning'
			case 'suspendue': return 'error'
			case 'arretee': return 'error'
			default: return 'warning'
		}
	}

	// Fonction pour obtenir l'icône du statut
	const getStatusIcon = (statut: string) => {
		switch (statut?.toLowerCase()) {
			case 'active': return <CheckCircle size={14} />
			case 'terminee': return <Clock size={14} />
			case 'suspendue': return <XCircle size={14} />
			case 'arretee': return <AlertCircle size={14} />
			default: return <Clock size={14} />
		}
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
									Prescriptions
								</h1>
								<p className="text-sm sm:text-base text-gray-600 mt-1">
									Gestion des prescriptions médicales
								</p>
							</div>
							<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
								<div className="flex items-center space-x-3 px-3 py-2 bg-gray-100/50 rounded-xl">
									<FileText size={16} className="text-gray-500" />
									<span className="text-xs sm:text-sm font-medium text-gray-700">{(prescriptions || []).length} prescriptions</span>
				</div>
								<div className="flex space-x-2">
									<Link 
										to="/prescriptions/interactions" 
										className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
									>
										<AlertCircle size={14} className="mr-1" />
										Vérifier interactions
					</Link>
									<Link 
										to="/prescriptions/nouvelle" 
										className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
									>
										<Plus size={16} className="mr-2" />
										<span className="font-medium">Nouvelle prescription</span>
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
							{ label: 'Actives', count: (prescriptions || []).filter(p => p.statut === 'active').length, color: 'text-green-600', bgColor: 'bg-green-50', icon: <CheckCircle size={20} className="text-green-600" /> },
							{ label: 'Terminées', count: (prescriptions || []).filter(p => p.statut === 'terminee').length, color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <Clock size={20} className="text-gray-600" /> },
							{ label: 'Suspendues', count: (prescriptions || []).filter(p => p.statut === 'suspendue').length, color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: <XCircle size={20} className="text-yellow-600" /> },
							{ label: 'Expirent bientôt', count: (prescriptions || []).filter(p => p.statut === 'active' && isExpiringSoon(p.date_fin)).length, color: 'text-orange-600', bgColor: 'bg-orange-50', icon: <AlertCircle size={20} className="text-orange-600" /> }
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

					{/* Filtres modernes */}
					<motion.div 
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className={`grid grid-cols-1 sm:grid-cols-2 ${isPatient ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-3 sm:gap-4 mb-6 sm:mb-8`}
					>
						{!isPatient && (
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
						)}
						<div className="relative">
							<Pill size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								value={filters.medicament_search}
								onChange={(e) => setFilters({ ...filters, medicament_search: e.target.value })}
								placeholder="Nom du médicament..."
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
								<option value="active">Active</option>
								<option value="terminee">Terminée</option>
								<option value="suspendue">Suspendue</option>
								<option value="arretee">Arrêtée</option>
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

			{/* Liste des prescriptions */}
					{(prescriptions || []).length > 0 ? (
						<motion.div 
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
							className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
						>
							{(prescriptions || []).map((prescription) => (
								<Card 
									key={prescription.id_prescription} 
									className={`p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer ${
										prescription.statut === 'active' && isExpiringSoon(prescription.date_fin) ? 'border-l-4 border-orange-400' : ''
									}`}
									onClick={() => {}}
								>
									<div className="flex items-start justify-between mb-4">
										<div className="flex items-center space-x-3">
											<Avatar name={prescription.nom_commercial || prescription.denomination_commune || 'Médicament'} size="md" />
											<div className="flex-1 min-w-0">
												<h3 className="text-sm font-semibold text-gray-900 truncate">
													{prescription.nom_commercial || prescription.denomination_commune || 'Médicament'}
												</h3>
												<p className="text-xs text-gray-500">
													{prescription.denomination_commune && prescription.nom_commercial 
														? prescription.denomination_commune 
														: 'Médicament'}
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											{getStatusIcon(prescription.statut)}
											<StatusBadge 
												status={prescription.statut} 
												variant={getStatusVariant(prescription.statut)} 
											/>
											{prescription.statut === 'active' && isExpiringSoon(prescription.date_fin) && (
												<span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
													⚠️ Expire bientôt
												</span>
											)}
										</div>
									</div>

									<div className="space-y-3 mb-4">
										{prescription.denomination_commune && prescription.nom_commercial && (
											<div className="flex items-center text-sm text-gray-600">
												<Pill size={14} className="mr-2 text-gray-400" />
												{prescription.denomination_commune}
											</div>
										)}
										<div className="flex items-center text-sm text-gray-600">
											<Calendar size={14} className="mr-2 text-gray-400" />
											Du {formatDate(prescription.date_debut)} {prescription.date_fin && `au ${formatDate(prescription.date_fin)}`}
										</div>
										{!isPatient && (
											<div className="flex items-center text-sm text-gray-600">
												<User size={14} className="mr-2 text-gray-400" />
												{prescription.medecin_nom && prescription.medecin_prenom 
													? `${prescription.medecin_prenom} ${prescription.medecin_nom}`
													: 'Médecin'}
											</div>
										)}
									</div>

									{/* Détails de la prescription */}
									<div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
										<div className="text-center">
											<div className="text-sm font-semibold text-blue-600">{prescription.dosage_prescrit}</div>
											<div className="text-xs text-gray-500">Dosage</div>
										</div>
										<div className="text-center">
											<div className="text-sm font-semibold text-green-600">{prescription.frequence}</div>
											<div className="text-xs text-gray-500">Fréquence</div>
										</div>
										<div className="text-center">
											<div className="text-sm font-semibold text-purple-600">{prescription.quantite_totale}</div>
											<div className="text-xs text-gray-500">Quantité</div>
										</div>
										<div className="text-center">
											<div className="text-sm font-semibold text-orange-600">{prescription.duree_traitement} jours</div>
											<div className="text-xs text-gray-500">Durée</div>
										</div>
									</div>

									<div className="mt-4 pt-4 border-t border-gray-100">
										<div className="flex space-x-2">
											<button 
												onClick={(e) => {
													e.stopPropagation()
													handleViewPrescription(prescription)
												}}
												className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium group-hover:bg-blue-100"
											>
												<Eye size={14} className="mr-1" />
												Voir
											</button>
											{!isPatient && prescription.statut === 'active' && (
												<button 
													onClick={(e) => {
														e.stopPropagation()
														handleRenouveler(prescription)
													}}
													className="inline-flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200"
													title="Renouveler la prescription"
												>
													<Clock size={14} />
												</button>
											)}
										</div>
									</div>
								</Card>
							))}
						</motion.div>
				) : (
					<EmptyState 
						title="Aucune prescription" 
						description="Aucune prescription ne correspond à vos critères de recherche."
						action={
								<Link 
									to="/prescriptions/nouvelle" 
									className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
								>
									<Plus size={16} className="mr-2" />
									Créer une prescription
							</Link>
						}
					/>
				)}
			</div>
								</div>

			{/* Modal détails prescription */}
			{showModal && selectedPrescription && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
					<div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
						<div className="p-6 border-b border-gray-200 flex items-center justify-between">
							<h2 className="text-xl font-semibold text-gray-900">Détails de la prescription</h2>
							<button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
								<XCircle size={24} />
							</button>
						</div>
						<div className="p-6 space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-500">Médicament</p>
									<p className="font-medium">{selectedPrescription.medicament_nom}</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Statut</p>
									<StatusBadge status={selectedPrescription.statut} variant={getStatusVariant(selectedPrescription.statut)} />
								</div>
								<div>
									<p className="text-sm text-gray-500">Dosage</p>
									<p className="font-medium">{selectedPrescription.dosage_prescrit}</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Fréquence</p>
									<p className="font-medium">{selectedPrescription.frequence}</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Date début</p>
									<p className="font-medium">{formatDate(selectedPrescription.date_debut)}</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Date fin</p>
									<p className="font-medium">{formatDate(selectedPrescription.date_fin)}</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Durée</p>
									<p className="font-medium">{selectedPrescription.duree_traitement} jours</p>
								</div>
								<div>
									<p className="text-sm text-gray-500">Quantité totale</p>
									<p className="font-medium">{selectedPrescription.quantite_totale}</p>
								</div>
							</div>
							{selectedPrescription.instructions_specifiques && (
								<div>
									<p className="text-sm text-gray-500 mb-1">Instructions</p>
									<p className="text-gray-900">{selectedPrescription.instructions_specifiques}</p>
								</div>
							)}
						</div>
						<div className="p-6 border-t border-gray-200 flex justify-end">
							<button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
								Fermer
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal renouveler prescription */}
			{showRenouvelerModal && selectedPrescription && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowRenouvelerModal(false)}>
					<div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
						<div className="p-6 border-b border-gray-200 flex items-center justify-between">
							<h2 className="text-xl font-semibold text-gray-900">Renouveler la prescription</h2>
							<button onClick={() => setShowRenouvelerModal(false)} className="text-gray-400 hover:text-gray-600">
								<XCircle size={24} />
							</button>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle durée (jours)</label>
								<input
									type="number"
									value={renouvelerData.nouvelle_duree}
									onChange={(e) => setRenouvelerData({ ...renouvelerData, nouvelle_duree: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
									min="1"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle quantité</label>
								<input
									type="number"
									value={renouvelerData.nouvelle_quantite}
									onChange={(e) => setRenouvelerData({ ...renouvelerData, nouvelle_quantite: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
									min="1"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
								<input
									type="date"
									value={renouvelerData.date_debut}
									onChange={(e) => setRenouvelerData({ ...renouvelerData, date_debut: e.target.value })}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
								/>
							</div>
						</div>
						<div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
							<button onClick={() => setShowRenouvelerModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
								Annuler
							</button>
							<button
								onClick={handleRenouvelerSubmit}
								disabled={renouvelerLoading || !renouvelerData.nouvelle_duree || !renouvelerData.nouvelle_quantite || !renouvelerData.date_debut}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{renouvelerLoading ? 'Renouvellement...' : 'Renouveler'}
							</button>
						</div>
					</div>
				</div>
			)}
		</Layout>
	)
}
