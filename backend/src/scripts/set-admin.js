#!/usr/bin/env node
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');

(async () => {
  try {
    const username = 'admin';
    const password = 'pass123';
    const email = 'admin@sante.sn';
    const role = 'admin';

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const existing = await executeQuery('SELECT id_user FROM utilisateurs WHERE nom_utilisateur = ?', [username]);
    if (existing.length > 0) {
      await executeQuery('UPDATE utilisateurs SET mot_de_passe = ?, role = ?, email = COALESCE(email, ?) WHERE nom_utilisateur = ?', [hash, role, email, username]);
      console.log('✅ Admin mis à jour. Identifiants: admin / pass123');
    } else {
      await executeQuery('INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, email, role, statut) VALUES (?,?,?,?,?)', [username, hash, email, role, 'actif']);
      console.log('✅ Admin créé. Identifiants: admin / pass123');
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  }
})();
