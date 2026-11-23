import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Gauge, Users, Stethoscope, CalendarDays, Building2, BarChart3, FileText, Pill, Clipboard, Syringe,
    Menu, X, LogOut, Bell, Search, Moon, Sun, User
} from 'lucide-react'
import NotificationBell from './NotificationBell'

function classNames(...classes: Array<string | boolean | undefined>) {
    return classes.filter(Boolean).join(' ')
}

import { useLogout } from '../hooks/useLogout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const handleLogout = useLogout();
    // Sidebar fermée par défaut sur mobile, ouverte sur desktop
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
        window.addEventListener('keydown', handler)

        // Gérer le redimensionnement de la fenêtre
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true)
            } else {
                setSidebarOpen(false)
            }
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('keydown', handler)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    const nav = [
        { to: '/dashboard', label: 'Dashboard', icon: Gauge },
        { to: '/patients', label: 'Patients', icon: Users },
        { to: '/medecins', label: 'Médecins', icon: Stethoscope },
        { to: '/rendez-vous', label: 'Rendez-vous', icon: CalendarDays },
        { to: '/centres', label: 'Centres', icon: Building2 },
    ]

    const medical = [
        { to: '/fiches-medicales', label: 'Consultations', icon: FileText },
        { to: '/medicaments', label: 'Médicaments', icon: Pill },
        { to: '/prescriptions', label: 'Prescriptions', icon: Clipboard },
        { to: '/vaccinations', label: 'Vaccinations', icon: Syringe },
    ]

    const admin = [
        { to: '/stats', label: 'Statistiques', icon: BarChart3 },
        { to: '/utilisateurs', label: 'Utilisateurs', icon: Users },
        { to: '/notifications', label: 'Notifications', icon: Bell },
    ]

    return (
        <div className="min-h-screen bg-gray-50 lg:flex">
            {/* Overlay pour mobile et tablette uniquement */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar moderne - fixe sur desktop, overlay sur mobile */}
            <motion.aside
                initial={false}
                animate={{ x: sidebarOpen ? 0 : -288 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed lg:sticky z-50 inset-y-0 left-0 w-72 bg-white border-r border-gray-200 transform lg:translate-x-0 top-0 lg:h-screen overflow-y-auto"
            >
                {/* Logo et header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200">
                    <Link to="/" className="flex items-center gap-3 font-bold text-gray-900">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 size={18} className="text-white" />
                        </div>
                        <span className="text-xl">Flup</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                        aria-label="Fermer le menu"
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Navigation principale */}
                <nav className="px-4 py-6 space-y-2 pb-24">
                    {nav.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => {
                                // Fermer le sidebar sur mobile après un clic
                                if (window.innerWidth < 1024) {
                                    setSidebarOpen(false)
                                }
                            }}
                            className={({ isActive }) => classNames(
                                'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <item.icon size={20} className="mr-3" />
                            {item.label}
                        </NavLink>
                    ))}

                    {/* Section Médicale */}
                    {(user?.role === 'medecin' || user?.role === 'admin' || user?.role === 'personnel') && (
                        <div className="pt-6 mt-6 border-t border-gray-200">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                🏥 Médical
                            </div>
                            <div className="mt-2 space-y-1">
                                {medical.map(item => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => {
                                            if (window.innerWidth < 1024) {
                                                setSidebarOpen(false)
                                            }
                                        }}
                                        className={({ isActive }) => classNames(
                                            'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        )}
                                    >
                                        <item.icon size={20} className="mr-3" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section Administration */}
                    {user?.role === 'admin' && (
                        <div className="pt-6 mt-6 border-t border-gray-200">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                ⚙️ Administration
                            </div>
                            <div className="mt-2 space-y-1">
                                {admin.map(item => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => {
                                            if (window.innerWidth < 1024) {
                                                setSidebarOpen(false)
                                            }
                                        }}
                                        className={({ isActive }) => classNames(
                                            'group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        )}
                                    >
                                        <item.icon size={20} className="mr-3" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Profil utilisateur en bas */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {user?.nom_utilisateur || 'Utilisateur'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize truncate">
                                {user?.role || 'Rôle'}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.aside>
            {/* Contenu principal */}
            <div className="flex-1 min-w-0 w-full lg:ml-0">
                {/* Header moderne */}
                <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Ouvrir la navigation"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="hidden sm:block">
                            <h1 className="text-base sm:text-lg font-semibold text-gray-900">Bienvenue, {user?.nom_utilisateur}</h1>
                            <p className="text-xs sm:text-sm text-gray-500 hidden lg:block">Plateforme de Gestion des Centres de Santé</p>
                        </div>
                        {/* Logo mobile */}
                        <div className="sm:hidden flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 size={14} className="text-white" />
                            </div>
                            <span className="font-bold text-gray-900">Flup</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Barre de recherche - cachée sur mobile et tablette */}
                        <div className="hidden xl:block relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Bouton recherche mobile */}
                        <button
                            className="xl:hidden p-2 rounded-lg hover:bg-gray-100"
                            aria-label="Rechercher"
                        >
                            <Search size={20} className="text-gray-600" />
                        </button>

                        {/* Notifications */}
                        <NotificationBell />

                        {/* Thème - caché sur mobile */}
                        <div className="hidden sm:block">
                            <ThemeToggle />
                        </div>

                        {/* Profil et déconnexion */}
                        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <User size={16} className="text-white" />
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-sm font-medium text-gray-900">{user?.nom_utilisateur}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                title="Déconnexion"
                                aria-label="Déconnexion"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Contenu principal */}
                <main className="min-h-screen w-full">
                    {children}
                </main>
            </div>
        </div>
    )
}

function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

    useEffect(() => {
        const root = document.documentElement
        if (theme === 'dark') root.classList.add('dark')
        else root.classList.remove('dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    return (
        <button
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    )
}
