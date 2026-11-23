# 📊 Guide des Migrations de Base de Données

## 🎯 Migrations à Appliquer

Ce document liste toutes les migrations qui doivent être appliquées sur la base de données pour que toutes les fonctionnalités fonctionnent correctement.

---

## 📋 Liste des Migrations

### 1. ✅ Migration des Colonnes Type RDV et Priorité
**Fichier:** `database/sql/migrations/add_type_rdv_priorite.sql`

**Description:** Ajoute les colonnes `type_rdv` et `priorite` à la table `rendez_vous` pour supporter les rendez-vous walk-in et la gestion des priorités.

**Statut:** ⏳ En attente d'application

**Impact:** 
- File d'attente (tri par priorité)
- Gestion des walk-ins
- Statistiques avancées

---

### 2. ✅ Migration de la Table Notifications
**Fichier:** `database/sql/migrations/fix_notifications_table.sql`

**Description:** Corrige la table `notifications` pour supporter les nouveaux types de notifications (retard, absence, reprogrammation) et ajoute la colonne `rdv_id`.

**Statut:** ⏳ En attente d'application

**Impact:** 
- Système de reprogrammation automatique
- Notifications de retard et absence
- Suivi des rendez-vous

---

## 🚀 Comment Appliquer les Migrations

### Option 1: Via Terminal MySQL (Recommandé)

```bash
# 1. Se connecter à MySQL
mysql -u votre_utilisateur -p

# 2. Sélectionner la base de données
USE nom_de_votre_base;

# 3. Appliquer la première migration
SOURCE C:/Users/WINDOWS 10/Desktop/NINSANP/database/sql/migrations/add_type_rdv_priorite.sql;

# 4. Appliquer la seconde migration
SOURCE C:/Users/WINDOWS 10/Desktop/NINSANP/database/sql/migrations/fix_notifications_table.sql;

# 5. Vérifier que tout s'est bien passé
SHOW COLUMNS FROM rendez_vous;
SHOW COLUMNS FROM notifications;
```

### Option 2: Via phpMyAdmin

1. Ouvrir phpMyAdmin
2. Sélectionner votre base de données
3. Aller dans l'onglet "SQL"
4. Copier-coller le contenu du fichier `add_type_rdv_priorite.sql`
5. Cliquer sur "Exécuter"
6. Répéter avec `fix_notifications_table.sql`

### Option 3: Via MySQL Workbench

1. Ouvrir MySQL Workbench
2. Se connecter à votre serveur
3. Ouvrir le fichier `add_type_rdv_priorite.sql`
4. Exécuter (⚡ icône éclair)
5. Répéter avec `fix_notifications_table.sql`

---

## 🔍 Vérification Post-Migration

### 1. Vérifier les colonnes de rendez_vous

```sql
SHOW COLUMNS FROM rendez_vous;
```

**Colonnes attendues:**
- ✅ `type_rdv` ENUM('rdv_normal', 'walk_in')
- ✅ `priorite` ENUM('normale', 'urgente')

### 2. Vérifier les colonnes de notifications

```sql
SHOW COLUMNS FROM notifications;
```

**Colonnes attendues:**
- ✅ `rdv_id` INT NULL
- ✅ `type` ENUM avec les valeurs: 'SMS', 'email', 'push', 'retard', 'absence', 'reprogramme', 'confirmation', 'rappel', 'annulation'

### 3. Vérifier les index

```sql
SHOW INDEX FROM notifications;
SHOW INDEX FROM rendez_vous;
```

---

## 🎛️ Après Application des Migrations

### 1. Redémarrer le serveur backend

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
cd backend
npm start
```

### 2. Réactiver les fonctionnalités temporairement désactivées

Une fois les migrations appliquées, vous devrez **réactiver** les colonnes `type_rdv` et `priorite` dans le fichier suivant :

**Fichier:** `backend/src/controllers/fileAttenteController.js`

**Lignes à restaurer:**

Dans `getFileAttente` (lignes ~115-145), restaurer:
```javascript
SELECT 
    rv.id_rdv,
    rv.patient_id,
    rv.medecin_id,
    rv.date_rdv,
    rv.heure_arrivee,
    rv.duree_estimee,
    rv.statut,
    rv.type_rdv,        // ✅ Réactiver
    rv.priorite,        // ✅ Réactiver
    // ...
FROM rendez_vous rv
// ...
ORDER BY 
    rv.priorite DESC,   // ✅ Réactiver (urgente en premier)
    rv.heure_arrivee ASC
```

Dans `getStatsFileAttente` (lignes ~200-280), restaurer:
```javascript
// Répartition par type
const repartitionType = await executeQuery(`
    SELECT 
        type_rdv,
        COUNT(*) as count
    FROM rendez_vous
    WHERE centre_id = ?
    AND statut IN ('attente', 'confirme')
    AND DATE(date_rdv) = CURDATE()
    GROUP BY type_rdv
`, [centreId]);

// Répartition par priorité
const repartitionPriorite = await executeQuery(`
    SELECT 
        priorite,
        COUNT(*) as count
    FROM rendez_vous
    WHERE centre_id = ?
    AND statut IN ('attente', 'confirme')
    AND DATE(date_rdv) = CURDATE()
    GROUP BY priorite
`, [centreId]);
```

Et dans le retour de la fonction:
```javascript
return res.json({
    success: true,
    data: {
        total_en_attente: totalEnAttente[0]?.count || 0,
        temps_attente_moyen: Math.round(tempsAttenteMoyen[0]?.temps_moyen || 0),
        repartition_type: repartitionType,      // ✅ Réactiver
        repartition_priorite: repartitionPriorite, // ✅ Réactiver
        repartition_statut: repartitionStatut,
        patients_arrives: patientsArrives
    }
});
```

### 3. Tester les fonctionnalités

- ✅ Check-in des patients
- ✅ File d'attente (doit afficher sans erreur)
- ✅ Réajustement des rendez-vous
- ✅ Walk-in
- ✅ Statistiques

---

## 📦 Contenu des Migrations

### Migration 1: add_type_rdv_priorite.sql

```sql
-- Ajout des colonnes type_rdv et priorite
ALTER TABLE rendez_vous
ADD COLUMN type_rdv ENUM('rdv_normal', 'walk_in') DEFAULT 'rdv_normal' AFTER date_rdv,
ADD COLUMN priorite ENUM('normale', 'urgente') DEFAULT 'normale' AFTER statut;

-- Mettre à jour les rendez-vous existants
UPDATE rendez_vous SET type_rdv = 'rdv_normal' WHERE type_rdv IS NULL;
UPDATE rendez_vous SET priorite = 'normale' WHERE priorite IS NULL;

-- Ajouter un index
CREATE INDEX idx_priorite ON rendez_vous (priorite);
```

### Migration 2: fix_notifications_table.sql

```sql
-- Modifier le type ENUM pour inclure les nouveaux types
ALTER TABLE notifications
MODIFY COLUMN type ENUM('SMS', 'email', 'push', 'retard', 'absence', 'reprogramme', 'confirmation', 'rappel', 'annulation') NOT NULL;

-- Ajouter la colonne rdv_id
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS rdv_id INT NULL AFTER patient_id,
ADD CONSTRAINT fk_notifications_rdv FOREIGN KEY (rdv_id) REFERENCES rendez_vous(id_rdv) ON DELETE SET NULL ON UPDATE CASCADE;

-- Ajouter des index
CREATE INDEX IF NOT EXISTS idx_rdv_id ON notifications(rdv_id);
CREATE INDEX IF NOT EXISTS idx_rdv_type ON notifications(rdv_id, type);
```

---

## ⚠️ Erreurs Connues et Solutions

### Erreur: "Unknown column 'type_rdv'"
**Cause:** Migration `add_type_rdv_priorite.sql` non appliquée

**Solution:** Appliquer la migration

---

### Erreur: "Data truncated for column 'type'"
**Cause:** Type de notification non supporté dans l'ENUM

**Solution:** Appliquer la migration `fix_notifications_table.sql`

---

### Erreur: "Unknown column 'rdv_id'"
**Cause:** Colonne `rdv_id` manquante dans la table `notifications`

**Solution:** Appliquer la migration `fix_notifications_table.sql`

---

### Erreur 500 lors de la reprogrammation
**Cause:** Table `notifications` non compatible

**Solution:** 
1. Appliquer la migration `fix_notifications_table.sql`
2. Redémarrer le serveur backend

---

### Erreur 500 dans la file d'attente
**Cause:** Colonnes `type_rdv` et `priorite` manquantes

**Solution:**
1. Appliquer la migration `add_type_rdv_priorite.sql`
2. Redémarrer le serveur backend
3. Réactiver les colonnes dans le controller (voir section "Après Application")

---

## 📞 Support

Si vous rencontrez des problèmes lors de l'application des migrations:

1. **Vérifier les logs du serveur MySQL** pour voir l'erreur exacte
2. **Vérifier les permissions** de l'utilisateur MySQL
3. **Sauvegarder la base de données** avant d'appliquer les migrations
4. **Tester sur une copie** de la base de données d'abord

---

## ✅ Checklist de Migration

- [ ] Sauvegarder la base de données
- [ ] Appliquer `add_type_rdv_priorite.sql`
- [ ] Appliquer `fix_notifications_table.sql`
- [ ] Vérifier les colonnes (SQL ci-dessus)
- [ ] Redémarrer le serveur backend
- [ ] Réactiver les colonnes dans `fileAttenteController.js`
- [ ] Tester toutes les fonctionnalités
- [ ] ✅ Tout fonctionne !

---

**Date de création:** 7 novembre 2025  
**Dernière mise à jour:** 7 novembre 2025  
**Version:** 1.0

