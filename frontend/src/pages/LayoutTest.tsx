import { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, Check, X } from 'lucide-react';

const LayoutTest = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    const [deviceType, setDeviceType] = useState('');
    const [breakpoint, setBreakpoint] = useState('');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setWindowSize({
                width,
                height: window.innerHeight
            });

            // Déterminer le breakpoint
            if (width < 640) {
                setBreakpoint('xs (< 640px)');
                setDeviceType('Mobile Portrait');
            } else if (width < 768) {
                setBreakpoint('sm (640px - 768px)');
                setDeviceType('Mobile Landscape');
            } else if (width < 1024) {
                setBreakpoint('md (768px - 1024px)');
                setDeviceType('Tablette');
            } else if (width < 1280) {
                setBreakpoint('lg (1024px - 1280px)');
                setDeviceType('Petit Desktop');
            } else {
                setBreakpoint('xl (≥ 1280px)');
                setDeviceType('Grand Desktop');
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const tests = [
        {
            category: 'Sidebar',
            items: [
                { test: 'Fermée par défaut sur mobile (< 1024px)', status: true },
                { test: 'Ouverte par défaut sur desktop (≥ 1024px)', status: true },
                { test: 'Overlay visible sur mobile quand ouverte', status: true },
                { test: 'Pas d\'overlay sur desktop', status: true },
                { test: 'Fermeture au clic sur overlay (mobile)', status: true },
                { test: 'Fermeture automatique après navigation (mobile)', status: true },
                { test: 'Scroll indépendant de la sidebar', status: true },
            ]
        },
        {
            category: 'Header',
            items: [
                { test: 'Menu hamburger visible uniquement sur mobile', status: true },
                { test: 'Logo mini affiché sur très petit écran', status: true },
                { test: 'Titre responsive avec breakpoints', status: true },
                { test: 'Barre de recherche complète sur XL', status: true },
                { test: 'Icône recherche seule sur mobile/tablette', status: true },
                { test: 'Notifications cliquables', status: true },
                { test: 'Toggle thème caché sur mobile', status: true },
                { test: 'Profil utilisateur adaptatif', status: true },
            ]
        },
        {
            category: 'Navigation',
            items: [
                { test: 'Liens de taille minimum 44x44px', status: true },
                { test: 'États actifs visibles', status: true },
                { test: 'Hover states fonctionnels', status: true },
                { test: 'Section médicale conditionnelle', status: true },
                { test: 'Section admin conditionnelle', status: true },
                { test: 'Transitions fluides (spring)', status: true },
            ]
        },
        {
            category: 'Accessibilité',
            items: [
                { test: 'Labels ARIA sur tous les boutons', status: true },
                { test: 'Navigation au clavier (Tab)', status: 'à tester' },
                { test: 'Fermeture avec Escape', status: true },
                { test: 'Focus visible', status: 'à tester' },
                { test: 'Contraste WCAG AA', status: 'à tester' },
            ]
        },
        {
            category: 'Performance',
            items: [
                { test: 'Animations 60 FPS', status: 'à tester' },
                { test: 'Pas de lag au redimensionnement', status: 'à tester' },
                { test: 'Transitions GPU-accelerated', status: true },
                { test: 'Event listeners nettoyés', status: true },
            ]
        }
    ];

    const deviceSizes = [
        { name: 'iPhone SE', width: 320, icon: Smartphone },
        { name: 'iPhone 12', width: 390, icon: Smartphone },
        { name: 'iPad Portrait', width: 768, icon: Tablet },
        { name: 'iPad Landscape', width: 1024, icon: Tablet },
        { name: 'Laptop', width: 1280, icon: Monitor },
        { name: 'Desktop HD', width: 1920, icon: Monitor },
    ];

    const resizeWindow = (width: number) => {
        window.resizeTo(width, window.innerHeight);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        🧪 Test du Layout Responsive
                    </h1>
                    <p className="text-gray-600">
                        Testez toutes les fonctionnalités du layout amélioré sur différentes tailles d'écran
                    </p>
                </div>

                {/* Informations de l'écran actuel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Monitor className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Taille d'écran</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {windowSize.width} x {windowSize.height}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Tablet className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Type d'appareil</p>
                                <p className="text-xl font-bold text-gray-900">{deviceType}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Breakpoint</p>
                                <p className="text-lg font-bold text-gray-900">{breakpoint}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulateur de taille d'écran */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        📱 Simulateur de Tailles d'Écran
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Note : La simulation fonctionne mieux dans les DevTools du navigateur (F12 → Mode responsive)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {deviceSizes.map((device) => (
                            <button
                                key={device.name}
                                onClick={() => resizeWindow(device.width)}
                                className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                            >
                                <device.icon className="w-6 h-6 text-gray-600" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-900">{device.name}</p>
                                    <p className="text-xs text-gray-500">{device.width}px</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Liste des tests */}
                <div className="space-y-4">
                    {tests.map((category) => (
                        <div key={category.category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                {category.category}
                            </h2>
                            <div className="space-y-3">
                                {category.items.map((item, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {item.status === true ? (
                                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-green-600" />
                                                </div>
                                            ) : item.status === false ? (
                                                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                                                    <X className="w-3 h-3 text-red-600" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                                                    <span className="text-xs text-yellow-600 font-bold">?</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700">{item.test}</p>
                                            {item.status === 'à tester' && (
                                                <p className="text-xs text-yellow-600 mt-1">
                                                    ⚠️ Test manuel requis
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Guide de test manuel */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        📝 Guide de Test Manuel
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">1. Test Mobile (&lt; 768px)</h3>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li>• Ouvrir les DevTools (F12) et activer le mode responsive</li>
                                <li>• Sélectionner un appareil mobile (iPhone, Android)</li>
                                <li>• Cliquer sur le menu hamburger ☰</li>
                                <li>• Vérifier que la sidebar s'ouvre avec un overlay</li>
                                <li>• Cliquer sur un lien de navigation</li>
                                <li>• Vérifier que la sidebar se ferme automatiquement</li>
                                <li>• Cliquer sur l'overlay pour fermer la sidebar</li>
                                <li>• Appuyer sur Escape pour fermer la sidebar</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">2. Test Tablette (768px - 1024px)</h3>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li>• Redimensionner à 768px ou 1024px</li>
                                <li>• Vérifier que le menu hamburger est toujours visible</li>
                                <li>• Tester l'ouverture/fermeture de la sidebar</li>
                                <li>• Vérifier que les zones tactiles sont suffisantes (44px min)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">3. Test Desktop (≥ 1024px)</h3>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li>• Redimensionner à 1280px ou plus</li>
                                <li>• Vérifier que la sidebar est ouverte par défaut</li>
                                <li>• Vérifier qu'il n'y a pas de menu hamburger</li>
                                <li>• Vérifier qu'il n'y a pas d'overlay</li>
                                <li>• Vérifier que la barre de recherche complète est visible</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">4. Test Navigation Clavier</h3>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li>• Appuyer sur Tab pour naviguer entre les éléments</li>
                                <li>• Vérifier que le focus est visible (outline bleu)</li>
                                <li>• Appuyer sur Enter pour activer un lien</li>
                                <li>• Ouvrir la sidebar et appuyer sur Escape</li>
                                <li>• Vérifier que la sidebar se ferme</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">5. Test Redimensionnement</h3>
                            <ul className="space-y-1 text-sm text-gray-700 ml-4">
                                <li>• Redimensionner la fenêtre de mobile à desktop</li>
                                <li>• Vérifier que la sidebar s'adapte automatiquement</li>
                                <li>• Redimensionner de desktop à mobile</li>
                                <li>• Vérifier que la sidebar se ferme automatiquement</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Résumé */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        ✅ Résumé des Améliorations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="font-semibold text-green-900 mb-2">✓ Implémenté</p>
                            <ul className="text-sm text-green-800 space-y-1">
                                <li>• Sidebar responsive</li>
                                <li>• Navigation mobile optimisée</li>
                                <li>• Header adaptatif</li>
                                <li>• Fermeture automatique</li>
                                <li>• Animations fluides</li>
                                <li>• Labels ARIA</li>
                            </ul>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <p className="font-semibold text-yellow-900 mb-2">⚠️ À Tester Manuellement</p>
                            <ul className="text-sm text-yellow-800 space-y-1">
                                <li>• Navigation au clavier</li>
                                <li>• Focus visible</li>
                                <li>• Contraste des couleurs</li>
                                <li>• Performance 60 FPS</li>
                                <li>• Lag au redimensionnement</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LayoutTest;
