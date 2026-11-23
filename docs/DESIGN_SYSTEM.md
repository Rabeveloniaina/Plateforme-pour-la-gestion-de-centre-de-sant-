# 🎨 Design System - NINSANP

## Vue d'ensemble

Ce design system définit les standards visuels et les composants pour assurer une expérience utilisateur cohérente, moderne et professionnelle dans toute l'application.

---

## 🎨 Palette de Couleurs

### Couleur Principale : Bleu

**Usage :** Navigation active, boutons primaires, liens, éléments interactifs

```css
/* Principale */
--primary-600: #2563eb  /* Couleur de base */
--primary-500: #3b82f6  /* Hover états */
--primary-700: #1d4ed8  /* Pressed états */
```

**Exemples d'utilisation :**
- Navigation active : `bg-blue-600 text-white`
- Boutons primaires : `bg-blue-600 hover:bg-blue-700`
- Liens : `text-blue-600 hover:text-blue-700`
- Badge info : `bg-blue-100 text-blue-800`

### Neutres : Gris

**Usage :** Textes, backgrounds, bordures, états désactivés

```css
--gray-50:  #f9fafb   /* Background très clair */
--gray-100: #f3f4f6   /* Background clair */
--gray-200: #e5e7eb   /* Bordures */
--gray-400: #9ca3af   /* Texte secondaire */
--gray-600: #4b5563   /* Icônes */
--gray-900: #111827   /* Texte principal */
```

### États Sémantiques

#### Succès (Vert Émeraude)
```css
--emerald-50:  #f0fdf4  /* Background */
--emerald-500: #10b981  /* Bordure/Icône */
--emerald-600: #059669  /* Hover */
```

**Usage :** Messages de succès, états validés, confirmations

#### Erreur (Rouge Rose)
```css
--rose-50:  #fef2f2  /* Background */
--rose-500: #f43f5e  /* Bordure/Icône */
--rose-600: #e11d48  /* Hover */
```

**Usage :** Messages d'erreur, états invalides, suppressions

#### Avertissement (Orange Ambre)
```css
--amber-50:  #fffbeb  /* Background */
--amber-500: #f59e0b  /* Bordure/Icône */
--amber-600: #d97706  /* Hover */
```

**Usage :** Avertissements, états en attente, actions importantes

#### Info (Bleu Cyan)
```css
--blue-50:  #eff6ff  /* Background */
--blue-500: #3b82f6  /* Bordure/Icône */
--blue-600: #2563eb  /* Hover */
```

**Usage :** Messages informatifs, aide contextuelle, tooltips

---

## 📐 Espacements

### Système basé sur 4px

```
xs:   8px   (0.5rem)
sm:   12px  (0.75rem)
base: 16px  (1rem)
md:   24px  (1.5rem)
lg:   32px  (2rem)
xl:   48px  (3rem)
```

### Utilisation

```tsx
// Padding
className="p-4"       // 16px tous côtés
className="px-6 py-4" // 24px horizontal, 16px vertical

// Margin
className="mb-6"      // 24px en bas
className="space-y-4" // 16px entre éléments enfants
```

---

## 🔲 Bordures et Rayons

### Rayons d'arrondissement

```
sm:   4px   (rounded-sm)
base: 8px   (rounded-lg)
md:   12px  (rounded-xl)
lg:   16px  (rounded-2xl)
full: 9999px (rounded-full)
```

### Utilisation

```tsx
// Cartes et conteneurs
className="rounded-xl"        // 12px

// Boutons
className="rounded-lg"        // 8px

// Avatar
className="rounded-full"      // Circulaire

// Badges
className="rounded-full"      // Pilule
```

---

## ✨ Ombres

### Hiérarchie des ombres

```
sm:   shadow-sm   // Éléments plats, inputs
base: shadow      // Cartes standards
md:   shadow-md   // Cartes élevées
lg:   shadow-lg   // Modales, dropdowns
xl:   shadow-xl   // Éléments flottants
```

### Utilisation

```tsx
// Carte standard
className="shadow-sm hover:shadow-md transition-shadow"

// Modal
className="shadow-xl"

// Toast
className="shadow-lg"
```

---

## 🔤 Typographie

### Tailles de texte

```
xs:   12px  (text-xs)    // Labels, notes
sm:   14px  (text-sm)    // Corps de texte secondaire
base: 16px  (text-base)  // Corps de texte principal
lg:   18px  (text-lg)    // Sous-titres
xl:   20px  (text-xl)    // Titres de sections
2xl:  24px  (text-2xl)   // Titres de pages
3xl:  30px  (text-3xl)   // Titres principaux
```

### Poids de police

```
normal:   400  (font-normal)
medium:   500  (font-medium)
semibold: 600  (font-semibold)
bold:     700  (font-bold)
```

### Utilisation

```tsx
// Titre de page
<h1 className="text-2xl font-bold text-gray-900">

// Sous-titre
<h2 className="text-xl font-semibold text-gray-900">

// Corps de texte
<p className="text-base text-gray-700">

// Label de formulaire
<label className="text-sm font-medium text-gray-700">
```

---

## 🎬 Animations et Transitions

### Durées

```typescript
fast: 150ms  // Hover, focus
base: 200ms  // Transitions standards
slow: 300ms  // Animations complexes
```

### Types de transitions

```tsx
// Transition standard
className="transition-colors duration-200"

// Transition multiple
className="transition-all duration-300 ease-out"

// Spring animation (Framer Motion)
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

### Micro-interactions

```tsx
// Hover scale
className="hover:scale-105 transition-transform"

// Active press
className="active:scale-95"

// Hover lift
className="hover:-translate-y-1 transition-transform"
```

---

## 🔘 Composants

### Boutons

#### Primaire
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium shadow-sm">
  Action
</button>
```

#### Secondaire
```tsx
<button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium">
  Annuler
</button>
```

#### Destructif
```tsx
<button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium">
  Supprimer
</button>
```

#### Tailles
```tsx
// Small
className="px-3 py-1.5 text-sm"

// Base
className="px-4 py-2 text-base"

// Large
className="px-6 py-3 text-lg"
```

### Cartes

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
  {/* Contenu */}
</div>
```

### Badges

#### Succès
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
  Actif
</span>
```

#### Erreur
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
  Inactif
</span>
```

#### Avertissement
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
  En attente
</span>
```

### Inputs

```tsx
<input 
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
  placeholder="Entrer..."
/>
```

**États :**
```tsx
// Erreur
className="border-rose-300 focus:ring-rose-500"

// Succès
className="border-emerald-300 focus:ring-emerald-500"

// Désactivé
className="bg-gray-100 cursor-not-allowed opacity-60"
```

---

## 🔔 Toast Notifications

### Design moderne

```tsx
// Succès
<div className="flex items-start gap-3 p-4 rounded-xl border-l-4 border-emerald-500 bg-white shadow-lg">
  <CheckCircle className="w-5 h-5 text-emerald-500" />
  <p className="text-sm font-medium text-gray-900">Opération réussie</p>
  <button>×</button>
</div>
```

### Caractéristiques
- ✅ Animation d'entrée depuis la droite
- ✅ Barre de progression visuelle
- ✅ Fermeture automatique (5s par défaut)
- ✅ Hover : légère élévation
- ✅ Bordure colorée à gauche
- ✅ Fond blanc avec ombre

---

## 📱 Responsivité

### Breakpoints

```
sm:  640px   // Mobile landscape
md:  768px   // Tablette
lg:  1024px  // Desktop
xl:  1280px  // Large desktop
2xl: 1536px  // Extra large
```

### Utilisation

```tsx
// Caché sur mobile, visible sur desktop
className="hidden lg:block"

// Grille responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Padding adaptatif
className="px-4 sm:px-6 lg:px-8"
```

---

## 🎯 Règles d'Utilisation

### DO ✅

1. **Utiliser une seule couleur principale** (Bleu #2563eb)
2. **Navigation active toujours en bleu solide** avec texte blanc
3. **Toast avec fond blanc** et bordure colorée
4. **Boutons primaires en bleu**, secondaires en blanc
5. **Transitions fluides** partout (200-300ms)
6. **Espacements cohérents** (multiples de 4px)
7. **Ombres légères** pour la profondeur

### DON'T ❌

1. ❌ Pas de gradients multicolores
2. ❌ Pas de couleurs vives multiples (vert/violet/orange) dans la navigation
3. ❌ Pas de bordures épaisses (max 4px pour accent)
4. ❌ Pas d'animations trop rapides (< 150ms) ou lentes (> 500ms)
5. ❌ Pas de texte coloré sans raison sémantique
6. ❌ Pas de backgrounds colorés dans les toasts
7. ❌ Pas d'ombres trop fortes (sauf modales)

---

## 📊 Hiérarchie Visuelle

### Importance décroissante

1. **Très important** : Bleu solide, gras, grand
   ```tsx
   <button className="bg-blue-600 text-white font-bold text-lg">
   ```

2. **Important** : Bleu solide, normal, moyen
   ```tsx
   <button className="bg-blue-600 text-white font-medium text-base">
   ```

3. **Normal** : Blanc avec bordure, normal, moyen
   ```tsx
   <button className="bg-white border border-gray-300 text-gray-700">
   ```

4. **Secondaire** : Texte seul, gris, petit
   ```tsx
   <button className="text-gray-600 hover:text-gray-900 text-sm">
   ```

---

## 🚀 Composants Prêts à l'Emploi

### Import du Design System

```typescript
import { colors, spacing, radius, shadows, transitions } from '@/config/designSystem';
```

### Exemple d'utilisation

```tsx
<div 
  style={{
    backgroundColor: colors.primary[600],
    padding: spacing.md,
    borderRadius: radius.lg,
    boxShadow: shadows.md,
  }}
>
  {/* Contenu */}
</div>
```

---

## 📚 Ressources

### Fichiers du Design System

- `frontend/src/config/designSystem.ts` - Variables et constantes
- `frontend/src/components/Toast.tsx` - Système de toast moderne
- `frontend/src/components/Layout.tsx` - Layout unifié
- `frontend/src/index.css` - Styles globaux et utilitaires

### Outils Recommandés

- **Tailwind CSS IntelliSense** - Extension VS Code
- **Headless UI** - Composants accessibles
- **Framer Motion** - Animations fluides
- **Lucide React** - Icônes cohérentes

---

## ✅ Checklist de Conformité

Avant de créer un nouveau composant :

- [ ] Utilise uniquement le bleu (#2563eb) comme couleur principale
- [ ] Respecte les espacements (multiples de 4px)
- [ ] Utilise les rayons d'arrondissement standards
- [ ] Inclut des transitions fluides (200-300ms)
- [ ] Fonctionne sur mobile, tablette et desktop
- [ ] Respecte les contrastes WCAG AA (4.5:1 minimum)
- [ ] Inclut les labels ARIA pour l'accessibilité
- [ ] N'utilise pas de gradients multicolores

---

**Date de création :** 2025-11-17  
**Version :** 1.0  
**Auteur :** Droid (Factory AI)
