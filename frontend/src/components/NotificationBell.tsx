import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { apiServices } from '../lib/api';
import type { Notification } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Récupérer le compteur de notifications non lues
    const fetchUnreadCount = async () => {
        try {
            const res = await apiServices.notifications.getUnreadCount();
            setUnreadCount(res.data?.count || 0);
        } catch (error) {
            console.error('Erreur récupération compteur notifications:', error);
        }
    };

    // Récupérer les notifications non lues
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await apiServices.notifications.getUnread({ limit: 5 });
            setNotifications(res.data || []);
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Marquer une notification comme lue
    const markAsRead = async (id: number) => {
        try {
            await apiServices.notifications.markAsRead(id);
            // Mettre à jour localement
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erreur marquage notification comme lue:', error);
        }
    };

    // Marquer toutes comme lues
    const markAllAsRead = async () => {
        try {
            await apiServices.notifications.markAllAsRead();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Erreur marquage toutes notifications comme lues:', error);
        }
    };

    // Polling toutes les 30 secondes
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Charger les notifications quand le panneau s'ouvre
    useEffect(() => {
        if (showPanel) {
            fetchNotifications();
        }
    }, [showPanel]);

    // Fermer le panneau si on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setShowPanel(false);
            }
        };

        if (showPanel) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPanel]);

    // Formater la date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        return date.toLocaleDateString('fr-FR');
    };

    // Obtenir l'icône selon le type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'confirmation':
                return '✅';
            case 'annulation':
                return '❌';
            case 'reprogramme':
                return '📅';
            case 'rappel':
                return '⏰';
            case 'retard':
                return '⚠️';
            case 'absence':
                return '❗';
            default:
                return '🔔';
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bouton cloche */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Notifications"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Panneau de notifications */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
                            <h3 className="text-white font-semibold text-lg">Notifications</h3>
                            <button
                                onClick={() => setShowPanel(false)}
                                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Liste des notifications */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium">Aucune notification</p>
                                    <p className="text-gray-400 text-sm mt-1">Vous êtes à jour !</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <span className="text-2xl flex-shrink-0">
                                                    {getNotificationIcon(notification.type)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    {notification.titre && (
                                                        <p className="font-semibold text-gray-900 text-sm mb-1">
                                                            {notification.titre}
                                                        </p>
                                                    )}
                                                    <p className="text-gray-600 text-sm line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        {formatDate(notification.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    Tout marquer comme lu
                                </button>
                                <a
                                    href="/notifications"
                                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                    onClick={() => setShowPanel(false)}
                                >
                                    Voir tout →
                                </a>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
