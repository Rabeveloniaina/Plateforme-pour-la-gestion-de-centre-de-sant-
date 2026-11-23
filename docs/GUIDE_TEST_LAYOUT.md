# 🧪 Guide de Test du Layout - NINSANP

## 🚀 Démarrage de l'Application

### Prérequis
- Node.js ≥ 16.0.0
- MySQL en cours d'exécution
- Terminal PowerShell ou CMD

### Étape 1 : Démarrer le Backend

```powershell
# Ouvrir un premier terminal
cd C:\Users\WINDOWS 10\Desktop\NINSANP\backend

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur backend
npm run dev
```

**Vérification** : Le backend devrait démarrer sur `http://localhost:5000`

### Étape 2 : Démarrer le Frontend

```powershell
# Ouvrir un second terminal
cd C:\Users\WINDOWS 10\Desktop\NINSANP\frontend

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur frontend
npm run dev
```

**Vérification** : Le frontend devrait démarrer sur `http://localhost:5173`

### Étape 3 : Se Connecter

1. Ouvrir le navigateur : `http://localhost:5173`
2. Se connecter avec vos identifiants
3. Une fois connecté, naviguer vers : `http://localhost:5173/test-layout`

---

## 📱 Tests à Effectuer

### Test 1 : Sidebar Mobile (< 1024px)

#### Configuration
1. Ouvrir les DevTools : `F12` ou `Ctrl+Shift+I`
2. Cliquer sur l'icône "Toggle Device Toolbar" : `Ctrl+Shift+M`
3. Sélectionner "iPhone 12 Pro" ou définir 390px

#### Tests à réaliser
- [ ] **Au chargement** : La sidebar est fermée
- [ ] **Clic sur hamburger** : La sidebar s'ouvre
- [ ] **Overlay visible** : Un fond sombre apparaît derrière
- [ ] **Clic sur overlay** : La sidebar se ferme
- [ ] **Clic sur lien nav** : La sidebar se ferme automatiquement
- [ ] **Touche Escape** : La sidebar se ferme
- [ ] **Bouton X visible** : En haut à droite de la sidebar

#### Capture d'écran
![Mobile Sidebar](./screenshots/mobile-sidebar.png)

---

### Test 2 : Sidebar Tablette (768px - 1024px)

#### Configuration
1. DevTools ouverts
2. Mode Device Toolbar activé
3. Sélectionner "iPad" ou définir 768px

#### Tests à réaliser
- [ ] **Au chargement** : La sidebar est fermée
- [ ] **Menu hamburger** : Visible et fonctionnel
- [ ] **Navigation** : Fermeture automatique après clic
- [ ] **Zones tactiles** : Tous les boutons ≥ 44px
- [ ] **Scroll** : La sidebar scroll indépendamment du contenu

---

### Test 3 : Sidebar Desktop (≥ 1024px)

#### Configuration
1. DevTools ouverts
2. Mode Device Toolbar activé
3. Définir 1280px ou désactiver le mode responsive

#### Tests à réaliser
- [ ] **Au chargement** : La sidebar est ouverte
- [ ] **Menu hamburger** : Invisible (caché)
- [ ] **Bouton X** : Invisible (caché)
- [ ] **Overlay** : N'apparaît jamais
- [ ] **Position** : Sidebar fixe (sticky) sur le côté
- [ ] **Contenu principal** : Décalé à droite de la sidebar

---

### Test 4 : Header Responsive

#### Mobile (< 640px)
- [ ] Menu hamburger visible
- [ ] Logo mini "Flup" affiché
- [ ] Icône de recherche (pas de barre complète)
- [ ] Icône notifications
- [ ] Avatar utilisateur
- [ ] Bouton déconnexion

#### Tablette (640px - 1024px)
- [ ] Menu hamburger visible
- [ ] Titre "Bienvenue, [utilisateur]" visible
- [ ] Icône de recherche
- [ ] Toggle thème visible
- [ ] Notifications
- [ ] Avatar + déconnexion

#### Desktop (≥ 1280px)
- [ ] Pas de menu hamburger
- [ ] Titre complet visible
- [ ] Barre de recherche complète
- [ ] Toggle thème visible
- [ ] Notifications
- [ ] Profil complet (nom + rôle) + déconnexion

---

### Test 5 : Redimensionnement Dynamique

#### Procédure
1. Commencer en mode mobile (390px)
2. Redimensionner progressivement vers desktop (1920px)
3. Observer le comportement à chaque breakpoint

#### Tests à réaliser
- [ ] **390px → 640px** : Logo mini → Titre condensé
- [ ] **640px → 768px** : Ajout toggle thème
- [ ] **768px → 1024px** : Sidebar reste mobile
- [ ] **1024px → 1280px** : Sidebar devient fixe, hamburger disparaît
- [ ] **1280px+** : Barre de recherche complète apparaît

#### Retour en arrière
1. Redimensionner de 1920px vers 390px
2. Vérifier que la sidebar se ferme automatiquement à < 1024px

---

### Test 6 : Navigation au Clavier

#### Tests à réaliser
- [ ] **Tab** : Naviguer entre tous les éléments
- [ ] **Focus visible** : Outline bleu visible sur l'élément actif
- [ ] **Enter** : Activer un lien de navigation
- [ ] **Escape** : Fermer la sidebar (si ouverte)
- [ ] **Shift+Tab** : Navigation en arrière

#### Ordre de tabulation attendu
1. Menu hamburger (mobile)
2. Liens de navigation (si sidebar ouverte)
3. Barre de recherche
4. Notifications
5. Toggle thème
6. Bouton déconnexion

---

### Test 7 : Animations et Transitions

#### Tests à réaliser
- [ ] **Sidebar ouvre** : Animation fluide (spring)
- [ ] **Sidebar ferme** : Animation fluide (spring)
- [ ] **Overlay apparaît** : Fade in 300ms
- [ ] **Overlay disparaît** : Fade out 300ms
- [ ] **Hover sur liens** : Changement de couleur fluide
- [ ] **Pas de lag** : 60 FPS constant

#### Comment vérifier les FPS
1. DevTools → Tab "Performance"
2. Cliquer sur "Record"
3. Ouvrir/fermer la sidebar plusieurs fois
4. Arrêter l'enregistrement
5. Vérifier que les FPS restent autour de 60

---

### Test 8 : Profil Utilisateur (Bas de Sidebar)

#### Tests à réaliser
- [ ] **Avatar gradient** : Bleu → Violet visible
- [ ] **Nom utilisateur** : Affiché et tronqué si trop long
- [ ] **Rôle** : Affiché et capitalisé
- [ ] **Fond distinct** : Gris clair (bg-gray-50)
- [ ] **Visible** : Même après scroll de la navigation
- [ ] **Position** : Toujours en bas de la sidebar

---

### Test 9 : Navigation Conditionnelle

#### Pour tester, il faut se connecter avec différents rôles

##### Médecin
- [ ] Section principale visible
- [ ] Section "🏥 Médical" visible
- [ ] Section "⚙️ Administration" CACHÉE

##### Admin Centre
- [ ] Section principale visible
- [ ] Section "🏥 Médical" visible
- [ ] Section "⚙️ Administration" visible

##### Personnel
- [ ] Section principale visible
- [ ] Section "🏥 Médical" visible
- [ ] Section "⚙️ Administration" CACHÉE

##### Patient
- [ ] Navigation limitée (voir dashboard patient)

---

### Test 10 : Accessibilité (WCAG)

#### Lecteur d'écran (Optionnel)
- [ ] Installer NVDA (Windows) ou VoiceOver (Mac)
- [ ] Activer le lecteur
- [ ] Naviguer dans l'interface
- [ ] Vérifier que tous les éléments sont annoncés

#### Contraste
- [ ] Texte gris sur fond blanc : Ratio ≥ 4.5:1
- [ ] Liens bleus : Ratio ≥ 4.5:1
- [ ] Boutons : Ratio ≥ 3:1

#### Outils de test
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Extension Chrome : "WAVE"

---

## 🐛 Bugs Courants à Vérifier

### Problèmes potentiels
- [ ] Sidebar ne se ferme pas sur mobile
- [ ] Overlay reste visible après fermeture
- [ ] Animations saccadées
- [ ] Menu hamburger visible sur desktop
- [ ] Contenu principal caché sous la sidebar
- [ ] Scroll bloqué quand sidebar ouverte
- [ ] Focus non visible
- [ ] Redimensionnement ne déclenche pas le changement

### Solutions
1. **Vider le cache** : `Ctrl+Shift+R`
2. **Redémarrer les serveurs**
3. **Vérifier la console** : Erreurs JavaScript ?
4. **Version de React** : Doit être 19.1.1

---

## 📊 Page de Test Automatique

Accéder à : `http://localhost:5173/test-layout`

Cette page contient :
- ✅ Informations sur la taille d'écran actuelle
- 📱 Simulateur de tailles d'écran
- ✓ Checklist des fonctionnalités
- 📝 Guide de test intégré

---

## 📸 Captures d'Écran Recommandées

### À capturer pour documentation
1. **Mobile** : Sidebar fermée
2. **Mobile** : Sidebar ouverte avec overlay
3. **Tablette** : Vue intermédiaire
4. **Desktop** : Sidebar fixe + contenu
5. **Header** : Comparaison mobile vs desktop
6. **Navigation** : États hover et actif

### Dossier
Sauvegarder dans : `docs/screenshots/`

---

## ✅ Checklist Finale

Avant de valider les améliorations :

### Fonctionnel
- [ ] Tous les tests mobile passés
- [ ] Tous les tests tablette passés
- [ ] Tous les tests desktop passés
- [ ] Redimensionnement fluide
- [ ] Navigation clavier fonctionnelle
- [ ] Pas de bugs visuels

### Performance
- [ ] Animations 60 FPS
- [ ] Pas de lag au scroll
- [ ] Pas de lag au redimensionnement
- [ ] Temps de chargement < 2s

### Accessibilité
- [ ] Labels ARIA présents
- [ ] Focus visible
- [ ] Contraste WCAG AA
- [ ] Navigation clavier complète

### Responsive
- [ ] 320px (iPhone SE) ✓
- [ ] 390px (iPhone 12) ✓
- [ ] 768px (iPad Portrait) ✓
- [ ] 1024px (iPad Landscape) ✓
- [ ] 1280px (Laptop) ✓
- [ ] 1920px (Desktop HD) ✓

---

## 🆘 Support

### En cas de problème

1. **Vérifier les logs**
   ```powershell
   # Backend
   Regarder le terminal backend
   
   # Frontend
   Regarder le terminal frontend + Console DevTools
   ```

2. **Réinstaller les dépendances**
   ```powershell
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Vérifier les ports**
   ```powershell
   # Vérifier si les ports sont utilisés
   netstat -ano | findstr :5000
   netstat -ano | findstr :5173
   ```

4. **Consulter la documentation**
   - `docs/AMELIORATIONS_LAYOUT.md`
   - `frontend/src/components/Layout.tsx`

---

## 📝 Rapport de Test

### Template de rapport

```markdown
# Rapport de Test Layout - [Date]

## Environnement
- OS : Windows 10
- Navigateur : Chrome 120
- Taille d'écran : 1920x1080

## Tests Effectués
- [x] Test 1 : Sidebar Mobile
- [x] Test 2 : Sidebar Tablette
- [ ] Test 3 : Sidebar Desktop (ÉCHEC - voir bugs)

## Bugs Trouvés
1. [Description du bug]
   - Sévérité : Haute/Moyenne/Faible
   - Reproduction : [Étapes]
   - Screenshot : [Lien]

## Recommandations
- [Amélioration suggérée 1]
- [Amélioration suggérée 2]

## Conclusion
✅ Prêt pour production
⚠️ Corrections mineures nécessaires
❌ Corrections majeures requises
```

---

**Bonne chance pour les tests ! 🎉**

Pour toute question : Consulter `AMELIORATIONS_LAYOUT.md`
