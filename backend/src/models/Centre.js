const { executeQuery } = require('../config/database');

class Centre {
    static async create(data) {
        const { 
            nom, 
            adresse, 
            region_id, 
            capacite_max = 100,
            telephone = null, 
            email = null, 
            type_centre = 'centre_sante',
            statut = 'actif' 
        } = data;
        const res = await executeQuery(
            `INSERT INTO centres_sante (nom, adresse, region_id, capacite_max, telephone, email, type_centre, statut) 
             VALUES (?,?,?,?,?,?,?,?)`,
            [nom, adresse, region_id, capacite_max, telephone, email, type_centre, statut]
        );
        return { id_centre: res.insertId, ...data };
    }

    static async findById(id) {
        const rows = await executeQuery(
            `SELECT c.*, r.nom as nom_region FROM centres_sante c LEFT JOIN regions r ON c.region_id = r.id_region WHERE c.id_centre = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async findAll(limit = 50, offset = 0, filters = {}) {
        let q = `SELECT c.*, r.nom as nom_region FROM centres_sante c LEFT JOIN regions r ON c.region_id = r.id_region WHERE 1=1`;
        const p = [];
        if (filters.region_id) { q += ' AND c.region_id = ?'; p.push(filters.region_id); }
        if (filters.statut) { q += ' AND c.statut = ?'; p.push(filters.statut); }
        if (filters.nom) { q += ' AND c.nom LIKE ?'; p.push(`%${filters.nom}%`); }
        q += ' ORDER BY c.nom LIMIT ? OFFSET ?';
        p.push(limit, offset);
        return executeQuery(q, p);
    }

    static async count(filters = {}) {
        let q = `SELECT COUNT(*) as total FROM centres_sante WHERE 1=1`;
        const p = [];
        if (filters.region_id) { q += ' AND region_id = ?'; p.push(filters.region_id); }
        if (filters.statut) { q += ' AND statut = ?'; p.push(filters.statut); }
        if (filters.nom) { q += ' AND nom LIKE ?'; p.push(`%${filters.nom}%`); }
        const rows = await executeQuery(q, p);
        return rows[0].total;
    }

    static async update(id, data) {
        const allowed = ['nom', 'adresse', 'region_id', 'capacite_max', 'telephone', 'email', 'type_centre', 'statut'];
        const sets = [];
        const p = [];
        allowed.forEach(f => { if (data[f] !== undefined) { sets.push(`${f} = ?`); p.push(data[f]); } });
        if (sets.length === 0) throw new Error('Aucun champ à mettre à jour');
        p.push(id);
        const res = await executeQuery(`UPDATE centres_sante SET ${sets.join(', ')} WHERE id_centre = ?`, p);
        if (res.affectedRows === 0) throw new Error('Centre non trouvé');
        return this.findById(id);
    }

    static async remove(id) {
        const res = await executeQuery(`UPDATE centres_sante SET statut = 'inactif' WHERE id_centre = ?`, [id]);
        if (res.affectedRows === 0) throw new Error('Centre non trouvé');
        return { message: 'Centre désactivé' };
    }
}

module.exports = Centre;
