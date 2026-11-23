import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { StatusBadge, Avatar } from '../components/Table'
import { formatDateTime } from '../lib/date'
import { ArrowLeft, Calendar, Clock, User, Stethoscope, MapPin, Phone, Mail, Edit, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function RendezVousDetail() {
	const { id } = useParams()
	const [data, setData] = useState<any | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		(async () => {
			setLoading(true)
			try {
				const res = await api.get<{ success: boolean; data: any }>(`/api/rendez-vous/${id}`)
				setData((res as any).data || null)
			} catch (e: any) { setError(e.message || 'Erreur') } finally { setLoading(false) }
		})()
	}, [id])

	// Fonction pour obtenir le variant du statut
	const getStatusVariant = (statut: string) => {
		switch (statut?.toLowerCase()) {
			case 'confirme': return 'success'
			case 'en_attente': return 'warning'
			case 'annule': return 'error'
			case 'termine': return 'success'
			default: return 'warning'
		}
	}

	// Fonction pour obtenir l'icône du statut
	const getStatusIcon = (statut: string) => {
		switch (statut?.toLowerCase()) {
			case 'confirme': return <CheckCircle size={16} />
			case 'en_attente': return <Clock size={16} />
			case 'annule': return <XCircle size={16} />
			case 'termine': return <CheckCircle size={16} />
			default: return <AlertCircle size={16} />
		}
	}

	if (loading) return <Loader />
	if (error) return (
		<Layout>
			<div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
				<EmptyState title="Erreur" description={error} />
			</div>
		</Layout>
	)
	if (!data) return (
		<Layout>
			<div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
				<EmptyState title="Rendez-vous introuvable" description="Le rendez-vous demandé n'existe pas ou a été supprimé." />
			</div>
		</Layout>
	)

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
								<Link 
									to="/rendez-vous" 
									className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
								>
									<ArrowLeft size={20} className="text-gray-600" />
								</Link>
								<div>
									<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
										Détails du rendez-vous
									</h1>
									<p className="text-sm sm:text-base text-gray-600 mt-1">
										Informations complètes du rendez-vous
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-3">
								{getStatusIcon(data.statut)}
								<StatusBadge 
									status={data.statut} 
									variant={getStatusVariant(data.statut)} 
								/>
								<Link
									to={`/rendez-vous/${id}/modifier`}
									className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200"
								>
									<Edit size={16} className="mr-2" />
									Modifier
								</Link>
							</div>
						</motion.div>
					</div>
				</div>

				<div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
					<div className="max-w-4xl mx-auto space-y-6">
						{/* Informations principales */}
						<motion.div 
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="grid grid-cols-1 lg:grid-cols-2 gap-6"
						>
							{/* Patient */}
							<Card className="p-6">
								<div className="flex items-center space-x-4 mb-4">
									<Avatar name={`${data.patient_nom} ${data.patient_prenom}`} size="lg" />
									<div>
										<h3 className="text-lg font-semibold text-gray-900">
											{data.patient_nom} {data.patient_prenom}
										</h3>
										<p className="text-sm text-gray-500">Patient</p>
									</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center text-sm text-gray-600">
										<User size={16} className="mr-3 text-gray-400" />
										<span className="font-medium">Nom complet:</span>
										<span className="ml-2">{data.patient_nom} {data.patient_prenom}</span>
									</div>
									{data.patient_telephone && (
										<div className="flex items-center text-sm text-gray-600">
											<Phone size={16} className="mr-3 text-gray-400" />
											<span className="font-medium">Téléphone:</span>
											<span className="ml-2">{data.patient_telephone}</span>
										</div>
									)}
									{data.patient_email && (
										<div className="flex items-center text-sm text-gray-600">
											<Mail size={16} className="mr-3 text-gray-400" />
											<span className="font-medium">Email:</span>
											<span className="ml-2">{data.patient_email}</span>
										</div>
									)}
								</div>
							</Card>

							{/* Médecin */}
							<Card className="p-6">
								<div className="flex items-center space-x-4 mb-4">
									<Avatar name={`${data.medecin_nom} ${data.medecin_prenom}`} size="lg" />
									<div>
										<h3 className="text-lg font-semibold text-gray-900">
											Dr. {data.medecin_nom} {data.medecin_prenom}
										</h3>
										<p className="text-sm text-gray-500">Médecin</p>
									</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center text-sm text-gray-600">
										<Stethoscope size={16} className="mr-3 text-gray-400" />
										<span className="font-medium">Spécialité:</span>
										<span className="ml-2">{data.medecin_specialite || 'Non spécifiée'}</span>
									</div>
									{data.medecin_telephone && (
										<div className="flex items-center text-sm text-gray-600">
											<Phone size={16} className="mr-3 text-gray-400" />
											<span className="font-medium">Téléphone:</span>
											<span className="ml-2">{data.medecin_telephone}</span>
										</div>
									)}
									{data.medecin_email && (
										<div className="flex items-center text-sm text-gray-600">
											<Mail size={16} className="mr-3 text-gray-400" />
											<span className="font-medium">Email:</span>
											<span className="ml-2">{data.medecin_email}</span>
										</div>
									)}
								</div>
							</Card>
						</motion.div>

						{/* Détails du rendez-vous */}
						<motion.div 
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="grid grid-cols-1 lg:grid-cols-2 gap-6"
						>
							<Card className="p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
									<Calendar size={20} className="mr-2 text-blue-600" />
									Informations du rendez-vous
								</h3>
								<div className="space-y-4">
									<div className="flex items-center justify-between py-2 border-b border-gray-100">
										<span className="font-medium text-gray-600">Date et heure</span>
										<span className="text-gray-900">{formatDateTime(data.date_rdv)}</span>
									</div>
									<div className="flex items-center justify-between py-2 border-b border-gray-100">
										<span className="font-medium text-gray-600">Statut</span>
										<StatusBadge 
											status={data.statut} 
											variant={getStatusVariant(data.statut)} 
										/>
									</div>
									{data.duree && (
										<div className="flex items-center justify-between py-2 border-b border-gray-100">
											<span className="font-medium text-gray-600">Durée</span>
											<span className="text-gray-900">{data.duree} minutes</span>
										</div>
									)}
									{data.type_consultation && (
										<div className="flex items-center justify-between py-2 border-b border-gray-100">
											<span className="font-medium text-gray-600">Type</span>
											<span className="text-gray-900">{data.type_consultation}</span>
										</div>
									)}
									{data.motif && (
										<div className="flex items-start justify-between py-2">
											<span className="font-medium text-gray-600">Motif</span>
											<span className="text-gray-900 text-right max-w-xs">{data.motif}</span>
										</div>
									)}
								</div>
							</Card>

							<Card className="p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
									<MapPin size={20} className="mr-2 text-green-600" />
									Centre de santé
								</h3>
								<div className="space-y-4">
									<div className="flex items-center justify-between py-2 border-b border-gray-100">
										<span className="font-medium text-gray-600">Nom</span>
										<span className="text-gray-900">{data.centre_nom || 'Non spécifié'}</span>
									</div>
									{data.centre_adresse && (
										<div className="flex items-start justify-between py-2 border-b border-gray-100">
											<span className="font-medium text-gray-600">Adresse</span>
											<span className="text-gray-900 text-right max-w-xs">{data.centre_adresse}</span>
										</div>
									)}
									{data.centre_telephone && (
										<div className="flex items-center justify-between py-2 border-b border-gray-100">
											<span className="font-medium text-gray-600">Téléphone</span>
											<span className="text-gray-900">{data.centre_telephone}</span>
										</div>
									)}
									{data.centre_email && (
										<div className="flex items-center justify-between py-2">
											<span className="font-medium text-gray-600">Email</span>
											<span className="text-gray-900">{data.centre_email}</span>
										</div>
									)}
								</div>
							</Card>
						</motion.div>

						{/* Notes et observations */}
						{(data.notes || data.observations) && (
							<motion.div 
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 }}
								className="grid grid-cols-1 lg:grid-cols-2 gap-6"
							>
								{data.notes && (
									<Card className="p-6">
										<h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
										<p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{data.notes}</p>
									</Card>
								)}
								{data.observations && (
									<Card className="p-6">
										<h3 className="text-lg font-semibold text-gray-900 mb-4">Observations</h3>
										<p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{data.observations}</p>
									</Card>
								)}
							</motion.div>
						)}
					</div>
				</div>
			</div>
		</Layout>
	)
}


