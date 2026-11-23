import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiServices } from '../lib/api'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { StatusBadge } from '../components/Table'
import { Search, Filter, Bell, Mail, Send, Clock, Eye, Trash2, RefreshCw } from 'lucide-react'
import type { Notification } from '../types'

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const res = await apiServices.notifications.getAll({ page: 1, limit: 100 })
            setNotifications(res.data || [])
        } catch (e: any) { setError(e.message || 'Erreur') } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    // const updateNotificationStatus = async (id: number, statut: string) => {
    //     try {
    //         await apiServices.notifications.updateStatut(id, statut)
    //         await load()
    //     } catch (e: any) { setError(e.message || 'Erreur MAJ notification') }
    // }

    const sendNotification = async (id: number) => {
        try {
            await apiServices.notifications.envoyer(id)
            await load()
        } catch (e: any) { setError(e.message || 'Erreur envoi notification') }
    }

    const retryNotification = async (id: number) => {
        try {
            await apiServices.notifications.relancer(id)
            await load()
        } catch (e: any) { setError(e.message || 'Erreur relance notification') }
    }

    const deleteNotification = async (id: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
            try {
                await apiServices.notifications.delete(id)
                await load()
            } catch (e: any) { setError(e.message || 'Erreur suppression notification') }
        }
    }

    // Fonction pour obtenir l'icône du statut
    // const getStatusIcon = (statut: string) => {
    //     switch (statut) {
    //         case 'envoyee': return <CheckCircle size={16} className="text-green-600" />
    //         case 'en_attente': return <Clock size={16} className="text-yellow-600" />
    //         case 'echec': return <XCircle size={16} className="text-red-600" />
    //         default: return <AlertCircle size={16} className="text-gray-600" />
    //     }
    // }

    // Fonction pour obtenir l'icône du type
    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'email': return <Mail size={16} className="text-blue-600" />
            case 'sms': return <Send size={16} className="text-green-600" />
            case 'rappel': return <Bell size={16} className="text-orange-600" />
            default: return <Bell size={16} className="text-gray-600" />
        }
    }

    // Filtrer les notifications
    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = notification.message.toLowerCase().includes(search.toLowerCase()) ||
                            (notification.patient_nom && notification.patient_nom.toLowerCase().includes(search.toLowerCase())) ||
                            (notification.medecin_nom && notification.medecin_nom.toLowerCase().includes(search.toLowerCase()))
        const matchesStatus = !statusFilter || notification.statut === statusFilter
        const matchesType = !typeFilter || notification.type.toLowerCase().includes(typeFilter.toLowerCase())
        return matchesSearch && matchesStatus && matchesType
    })

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
                                    Notifications
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 mt-1">
                                    Gestion des notifications et communications
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100/50 rounded-xl">
                                    <Bell size={16} className="text-gray-500" />
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">{filteredNotifications.length} notifications</span>
                                </div>
                                <button 
                                    onClick={load}
                                    className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                                >
                                    <RefreshCw size={16} className="mr-2" />
                                    <span className="font-medium">Actualiser</span>
                                </button>
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
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8"
                    >
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                placeholder="Rechercher une notification..."
                                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select 
                                className="appearance-none pl-10 pr-8 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                value={statusFilter} 
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="en_attente">En attente</option>
                                <option value="envoyee">Envoyée</option>
                                <option value="echec">Échec</option>
                            </select>
                        </div>
                        <div className="relative">
                            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select 
                                className="appearance-none pl-10 pr-8 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                value={typeFilter} 
                                onChange={e => setTypeFilter(e.target.value)}
                            >
                                <option value="">Tous les types</option>
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="rappel">Rappel</option>
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

                    {/* Liste des notifications */}
                    {!loading && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                        >
                            {filteredNotifications.map((notification) => (
                                <Card key={notification.id} className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                    {notification.type.toUpperCase()}
                                                </h3>
                                                <p className="text-xs text-gray-500">ID: {notification.id}</p>
                                            </div>
                                        </div>
                                        <StatusBadge 
                                            status={notification.statut} 
                                            variant={notification.statut === 'envoyee' ? 'success' : notification.statut === 'en_attente' ? 'warning' : 'error'} 
                                        />
                                    </div>
                                    
                                    <div className="space-y-3 mb-4">
                                        <div className="text-sm text-gray-600">
                                            <p className="line-clamp-2">{notification.message}</p>
                                        </div>
                                        {notification.patient_nom && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-medium">Patient:</span>
                                                <span className="ml-2">{notification.patient_nom} {notification.patient_prenom}</span>
                                            </div>
                                        )}
                                        {notification.medecin_nom && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-medium">Médecin:</span>
                                                <span className="ml-2">{notification.medecin_nom} {notification.medecin_prenom}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Clock size={14} className="mr-2 text-gray-400" />
                                            <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {notification.tentatives && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-medium">Tentatives:</span>
                                                <span className="ml-2">{notification.tentatives}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex space-x-2">
                                            {notification.statut === 'en_attente' && (
                                                <button 
                                                    onClick={() => sendNotification(notification.id)}
                                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200 text-sm font-medium"
                                                >
                                                    <Send size={14} className="mr-1" />
                                                    Envoyer
                                                </button>
                                            )}
                                            {notification.statut === 'echec' && (
                                                <button 
                                                    onClick={() => retryNotification(notification.id)}
                                                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors duration-200 text-sm font-medium"
                                                >
                                                    <RefreshCw size={14} className="mr-1" />
                                                    Relancer
                                                </button>
                                            )}
                                            <button className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                                                <Eye size={14} />
                                            </button>
                                            <button 
                                                onClick={() => deleteNotification(notification.id)}
                                                className="inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </motion.div>
                    )}

                    {!loading && !error && filteredNotifications.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune notification trouvée</h3>
                            <p className="text-gray-600">Ajustez vos filtres ou créez une nouvelle notification.</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
