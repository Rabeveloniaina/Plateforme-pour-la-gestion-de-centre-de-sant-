import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { ArrowLeft, Save, Calendar, User, FileText, Search, AlertTriangle } from 'lucide-react'

export default function RendezVousForm() {
	const { id } = useParams()
	const navigate = useNavigate()
	const { user } = useAuth()
	const { showToast } = useToast()
	const isEdit = !!id
	const isAdminCentre = user?.role === 'admin_centre'
	
	const [formData, setFormData] = useState({
		patient_id: '',
		medecin_id: '',
		centre_id: '',
		region_id: '',
		date_rdv: '',
		heure_rdv: '',
		duree: '30',
		type_consultation: 'consultation',
		motif: '',
		notes: '',
		statut: 'attente'
	})
	
	const [patientSearchTerm, setPatientSearchTerm] = useState('')
	const [patientSearchResults, setPatientSearchResults] = useState<any[]>([])
	const [selectedPatient, setSelectedPatient] = useState<any>(null)
	const [searchingPatients, setSearchingPatients] = useState(false)
	
	const [medecins, setMedecins] = useState<any[]>([])
	const [centres, setCentres] = useState<any[]>([])
	const [regions, setRegions] = useState<any[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Charger les données pour l'édition
	useEffect(() => {
		if (isEdit && id) {
			(async () => {
				try {
				const res = await api.get(`/rendez-vous/${id}`)
				setFormData((res as any).data)
				} catch (e: any) {
					setError(e.message || 'Erreur lors du chargement')
				}
			})()
		}
	}, [id, isEdit])

	// Auto-compléter centre et région pour admin_centre
	useEffect(() => {
		if (isAdminCentre && user?.id_centre) {
			(async () => {
				try {
					const centreRes = await api.get<{success: boolean; data: any}>(`/centres/${user.id_centre}`)
					const centre = centreRes.data
					setFormData(prev => ({
						...prev,
						centre_id: centre.id_centre.toString(),
						region_id: centre.region_id.toString()
					}))
				} catch (e) {
					console.error('Erreur chargement centre:', e)
				}
			})()
		}
	}, [isAdminCentre, user])

	// Charger les données de référence
	useEffect(() => {
		(async () => {
			try {
				// Ne charger les centres et régions que pour ministere
				const promises = []
				if (!isAdminCentre) {
					promises.push(api.get('/centres'))
					promises.push(api.get('/regions'))
				}
				
				// Charger les médecins (filtrés par centre pour admin_centre)
				const medecinUrl = isAdminCentre && user?.id_centre 
					? `/medecins?centre_id=${user.id_centre}`
					: '/medecins'
				promises.push(api.get(medecinUrl))
				
				const results = await Promise.all(promises)
				
				let idx = 0
				if (!isAdminCentre) {
					setCentres(((results[idx++] as any).data || []))
					setRegions(((results[idx++] as any).data || []))
				}
				setMedecins(((results[idx] as any).data || []))
			} catch (e: any) {
				console.error('Erreur lors du chargement des données:', e)
			}
		})()
	}, [isAdminCentre, user])

	// Recherche de patients avec debounce
	useEffect(() => {
		if (patientSearchTerm.length < 3) {
			setPatientSearchResults([])
			return
		}

		const timer = setTimeout(async () => {
			setSearchingPatients(true)
			try {
				const centreFilter = isAdminCentre && user?.id_centre ? `&centre_id=${user.id_centre}` : ''
				const res = await api.get<{success: boolean; data: any[]}>(`/patients/search?q=${encodeURIComponent(patientSearchTerm)}${centreFilter}`)
				setPatientSearchResults(res.data || [])
			} catch (e) {
				console.error('Erreur recherche patients:', e)
				setPatientSearchResults([])
			} finally {
				setSearchingPatients(false)
			}
		}, 300) // Debounce de 300ms

		return () => clearTimeout(timer)
	}, [patientSearchTerm, isAdminCentre, user])
	
	const handleSelectPatient = (patient: any) => {
		setSelectedPatient(patient)
		setFormData(prev => ({ ...prev, patient_id: patient.id_patient.toString() }))
		setPatientSearchTerm(`${patient.prenom} ${patient.nom} - ${patient.telephone}`)
		setPatientSearchResults([])
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)

		try {
			// Combiner date et heure
			const dateTime = `${formData.date_rdv}T${formData.heure_rdv}:00`
			const dataToSend = {
				...formData,
				date_rdv: dateTime,
				duree: parseInt(formData.duree)
			}

			if (isEdit) {
				await api.put(`/rendez-vous/${id}`, dataToSend)
			} else {
				await api.post('/rendez-vous', dataToSend)
			}
			showToast(`Rendez-vous ${isEdit ? 'modifié' : 'créé'} avec succès`, 'success')
			navigate('/rendez-vous')
		} catch (e: any) {
			const errorMessage = e instanceof ApiError ? e.getMessage() : (e.message || 'Erreur lors de la sauvegarde')
			setError(errorMessage)
			showToast(errorMessage, 'error')
		} finally {
			setLoading(false)
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
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
							<div className="flex items-center space-x-4">
								<button 
									onClick={() => navigate('/rendez-vous')}
									className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
								>
									<ArrowLeft size={20} className="text-gray-600" />
								</button>
								<div>
									<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
										{isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
									</h1>
									<p className="text-sm sm:text-base text-gray-600 mt-1">
										{isEdit ? 'Modifiez les informations du rendez-vous' : 'Planifiez un nouveau rendez-vous'}
									</p>
								</div>
							</div>
						</motion.div>
					</div>
				</div>

				<div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
					<div className="max-w-4xl mx-auto">
						{error && (
							<motion.div 
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
							>
								{error}
							</motion.div>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Sélection des participants */}
							<Card className="p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
									<User size={20} className="mr-2 text-blue-600" />
									Participants
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Recherche patient */}
									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Patient * <span className="text-xs text-gray-500">(Tapez au moins 3 caractères pour rechercher)</span>
										</label>
										<div className="relative">
											<div className="relative">
												<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
												<input
													type="text"
													value={patientSearchTerm}
													onChange={(e) => setPatientSearchTerm(e.target.value)}
													placeholder="Rechercher un patient (nom, prénom, téléphone...)"
													className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												/>
											</div>
											{searchingPatients && (
												<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
													<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
												</div>
											)}
											{/* Résultats de recherche */}
											{patientSearchResults.length > 0 && (
												<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
													{patientSearchResults.map(patient => (
														<button
															key={patient.id_patient}
															type="button"
															onClick={() => handleSelectPatient(patient)}
															className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between border-b last:border-b-0"
														>
															<div>
																<p className="font-medium text-gray-900">{patient.prenom} {patient.nom}</p>
																<p className="text-sm text-gray-600">{patient.telephone}</p>
															</div>
															<span className="text-xs text-gray-500">{patient.centre_nom || 'N/A'}</span>
														</button>
													))}
												</div>
											)}
											{/* Afficher le patient sélectionné */}
											{selectedPatient && (
												<div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
													<div>
														<p className="font-medium text-green-900">Patient sélectionné :</p>
														<p className="text-sm text-green-700">{selectedPatient.prenom} {selectedPatient.nom} - {selectedPatient.telephone}</p>
													</div>
													<button
														type="button"
														onClick={() => {
															setSelectedPatient(null)
															setFormData(prev => ({ ...prev, patient_id: '' }))
															setPatientSearchTerm('')
														}}
														className="text-red-600 hover:text-red-800"
													>
														Changer
													</button>
												</div>
											)}
										</div>
									</div>

									{/* Région et Centre - Masqués pour admin_centre */}
									{!isAdminCentre && (
										<>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Région *
										</label>
										<select
											name="region_id"
											value={formData.region_id}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="">Sélectionner une région</option>
											{regions.map(region => (
												<option key={region.id_region} value={region.id_region}>
															{region.nom}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Centre de santé *
										</label>
										<select
											name="centre_id"
											value={formData.centre_id}
											onChange={handleChange}
											required
											disabled={!formData.region_id}
											className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
												!formData.region_id ? 'bg-gray-100 cursor-not-allowed' : ''
											}`}
										>
											<option value="">
												{!formData.region_id ? 'Sélectionnez d\'abord une région' : 'Sélectionner un centre'}
											</option>
													{centres.filter(c => c.region_id === parseInt(formData.region_id)).map(centre => (
												<option key={centre.id_centre} value={centre.id_centre}>
													{centre.nom}
												</option>
											))}
										</select>
									</div>
										</>
									)}

									{/* Médecin */}
									<div className={!isAdminCentre ? 'md:col-span-2' : 'md:col-span-2'}>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Médecin *
										</label>
										<select
											name="medecin_id"
											value={formData.medecin_id}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="">Sélectionner un médecin</option>
											{medecins.map(medecin => (
												<option key={medecin.id_medecin} value={medecin.id_medecin}>
													Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
												</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Statut *
										</label>
										<select
											name="statut"
											value={formData.statut}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="attente">En attente</option>
											<option value="confirme">Confirmé</option>
											<option value="annule">Annulé</option>
											<option value="termine">Terminé</option>
											<option value="absent">Absent</option>
										</select>
									</div>
								</div>
							</Card>

							{/* Détails du rendez-vous */}
							<Card className="p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
									<Calendar size={20} className="mr-2 text-green-600" />
									Détails du rendez-vous
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Date *
										</label>
										<input
											type="date"
											name="date_rdv"
											value={formData.date_rdv}
											onChange={handleChange}
											required
											min={new Date().toISOString().split('T')[0]}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Heure *
										</label>
										<input
											type="time"
											name="heure_rdv"
											value={formData.heure_rdv}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Durée (minutes) *
										</label>
										<select
											name="duree"
											value={formData.duree}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="15">15 minutes</option>
											<option value="30">30 minutes</option>
											<option value="45">45 minutes</option>
											<option value="60">1 heure</option>
											<option value="90">1h30</option>
											<option value="120">2 heures</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Type de consultation *
										</label>
										<select
											name="type_consultation"
											value={formData.type_consultation}
											onChange={handleChange}
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="consultation">Consultation</option>
											<option value="controle">Contrôle</option>
											<option value="urgence">Urgence</option>
											<option value="suivi">Suivi</option>
											<option value="prevention">Prévention</option>
										</select>
									</div>
								</div>
							</Card>

							{/* Motif et notes */}
							<Card className="p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
									<FileText size={20} className="mr-2 text-purple-600" />
									Informations complémentaires
								</h3>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Motif de consultation *
										</label>
										<textarea
											name="motif"
											value={formData.motif}
											onChange={handleChange}
											required
											rows={3}
											placeholder="Décrivez le motif de la consultation..."
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Notes additionnelles
										</label>
										<textarea
											name="notes"
											value={formData.notes}
											onChange={handleChange}
											rows={3}
											placeholder="Informations supplémentaires..."
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
								</div>

								{/* Boutons d'action */}
								<div className="flex items-center justify-end gap-4 pt-6 border-t">
									<button
										type="button"
										onClick={() => navigate('/rendez-vous')}
										className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
									>
										Annuler
									</button>
									<button
										type="submit"
										disabled={loading}
										className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<Save size={18} className="mr-2" />
										{loading ? 'Sauvegarde...' : (isEdit ? 'Modifier' : 'Créer le rendez-vous')}
									</button>
								</div>
							</Card>
						</form>
					</div>
				</div>
			</div>
		</Layout>
	)
}
