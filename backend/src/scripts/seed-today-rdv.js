require('dotenv').config();
const { executeQuery } = require('../config/database');

async function main() {
  try {
    // Find one patient, one medecin, one centre
    const [patient] = await executeQuery("SELECT id_patient FROM patients WHERE statut <> 'inactif' LIMIT 1", []);
    const [medecin] = await executeQuery("SELECT id_medecin, centre_id FROM medecins WHERE statut <> 'inactif' LIMIT 1", []);
    const centreId = medecin ? medecin.centre_id : null;

    if (!patient || !medecin || !centreId) {
      console.log('Missing base data (patient/medecin/centre). Please ensure seed data exists.');
      process.exit(0);
    }

    const now = new Date();
    const { formatDateTimeForMySQL } = require('../utils/dateFormatter');
    const toMySQL = (d) => formatDateTimeForMySQL(d);

    const slots = [0, 60, 120].map(min => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0 + min));

    for (const d of slots) {
      await executeQuery(
        `INSERT INTO rendez_vous (patient_id, medecin_id, centre_id, date_rdv, symptomes, orientation, duree_estimee, statut)
         VALUES (?, ?, ?, ?, ?, 'generaliste', ?, 'attente')`,
        [patient.id_patient, medecin.id_medecin, centreId, toMySQL(d), JSON.stringify(['fièvre']), 30]
      );
    }

    console.log('Seeded 3 rendez-vous for today.');
    process.exit(0);
  } catch (e) {
    console.error('Seed error:', e);
    process.exit(1);
  }
}

main();


