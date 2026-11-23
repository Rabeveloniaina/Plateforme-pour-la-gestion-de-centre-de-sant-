import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiServices } from '../lib/api'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { StatusBadge, Avatar } from '../components/Table'
import { Search, Filter, Users as UsersIcon, Mail, Eye, Edit, Plus, UserCheck, Crown, User as UserIcon, Trash2, Shield } from 'lucide-react'
import type { User } from '../types'

export default function Users() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const res = await apiServices.users.getAll({ page: 1, limit: 100 })
            setUsers(res.data || [])
        } catch (e: any) { setError(e.message || 'Erreur') } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    // const updateUser = async (id: number, data: Partial<User>) => {
    //     try {
    //         await apiServices.users.update(id, data)
    //         await load()
    //     } catch (e: any) { setError(e.message || 'Erreur MAJ utilisateur') }
    // }

    const deleteUser = async (id: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await apiServices.users.delete(id)
                await load()
            } catch (e: any) { setError(e.message || 'Erreur suppression utilisateur') }
        }
    }

    const toggleUserStatus = async (id: number, currentStatus: string) => {
        try {
            if (currentStatus === 'actif') {
                await apiServices.users.deactivate(id)
            } else {
                await apiServices.users.activate(id)
            }
            await load()
        } catch (e: any) { setError(e.message || 'Erreur changement statut') }
    }

    // Fonction pour obtenir l'icône du rôle
    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin': return <Crown size={16} className="text-purple-600" />
            case 'medecin': return <UserCheck size={16} className="text-blue-600" />
            case 'personnel': return <UserIcon size={16} className="text-green-600" />
            case 'patient': return <UsersIcon size={16} className="text-gray-600" />
            default: return <UserIcon size={16} className="text-gray-600" />
        }
    }

    // Filtrer les utilisateurs
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.nom_utilisateur.toLowerCase().includes(search.toLowerCase()) ||
                            (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
        const matchesRole = !roleFilter || user.role === roleFilter
        return matchesSearch && matchesRole
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
                                    Utilisateurs
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600 mt-1">
                                    Gestion des comptes et des rôles
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100/50 rounded-xl">
                                    <UsersIcon size={16} className="text-gray-500" />
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">{filteredUsers.length} utilisateurs</span>
                                </div>
                                <button className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                                    <Plus size={16} className="mr-2" />
                                    <span className="font-medium">Nouvel utilisateur</span>
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
                                placeholder="Rechercher un utilisateur..."
                                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select 
                                className="appearance-none pl-10 pr-8 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                value={roleFilter} 
                                onChange={e => setRoleFilter(e.target.value)}
                            >
                                <option value="">Tous les rôles</option>
                                <option value="admin">Administrateur</option>
                                <option value="medecin">Médecin</option>
                                <option value="personnel">Personnel</option>
                                <option value="patient">Patient</option>
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

                    {/* Liste des utilisateurs */}
                    {!loading && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                        >
                            {filteredUsers.map((user) => (
                                <Card key={user.id_user} className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar name={user.nom_utilisateur} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate">{user.nom_utilisateur}</h3>
                                                <p className="text-xs text-gray-500">ID: {user.id_user}</p>
                                            </div>
                                        </div>
                                        <StatusBadge 
                                            status={user.statut} 
                                            variant={user.statut === 'actif' ? 'success' : 'error'} 
                                        />
                                    </div>
                                    
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Mail size={14} className="mr-2 text-gray-400" />
                                            {user.email || 'Aucun email'}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            {getRoleIcon(user.role)}
                                            <span className="ml-2 capitalize">{user.role}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex space-x-2">
                                            <button className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium group-hover:bg-blue-100">
                                                <Eye size={14} className="mr-1" />
                                                Voir
                                            </button>
                                            <button 
                                                onClick={() => toggleUserStatus(user.id_user, user.statut)}
                                                className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                                title={user.statut === 'actif' ? 'Désactiver' : 'Activer'}
                                            >
                                                <Shield size={14} />
                                            </button>
                                            <button className="inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={() => deleteUser(user.id_user)}
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

                    {!loading && !error && filteredUsers.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12"
                        >
                            <UsersIcon size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
                            <p className="text-gray-600">Ajustez vos filtres ou créez un nouvel utilisateur.</p>
                        </motion.div>
                    )}
            </div>
        </div>
        </Layout>
    )
}


