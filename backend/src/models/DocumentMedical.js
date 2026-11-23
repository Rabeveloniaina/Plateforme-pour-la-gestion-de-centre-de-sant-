/**
 * Modèle pour les documents médicaux uploadés
 */

const { executeQuery } = require('../config/database');
const path = require('path');
const fs = require('fs');
const { UPLOAD_DIR } = require('../config/upload');

class DocumentMedical {
    // Créer un nouveau document
    static async create(documentData) {
        const {
            fiche_medicale_id = null,
            patient_id,
            rendez_vous_id = null,
            prescription_id = null,
            nom_fichier,
            nom_fichier_original,
            chemin_fichier,
            type_fichier,
            taille_fichier,
            type_document = 'autre',
            description = null,
            upload_par,
            date_examen = null
        } = documentData;

        const query = `
            INSERT INTO documents_medicaux (
                fiche_medicale_id, patient_id, rendez_vous_id, prescription_id,
                nom_fichier, nom_fichier_original, chemin_fichier, type_fichier, taille_fichier,
                type_document, description, upload_par, date_examen
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            fiche_medicale_id, patient_id, rendez_vous_id, prescription_id,
            nom_fichier, nom_fichier_original, chemin_fichier, type_fichier, taille_fichier,
            type_document, description, upload_par, date_examen
        ];

        try {
            const result = await executeQuery(query, params);
            return {
                id_document: result.insertId,
                id: result.insertId,
                ...documentData
            };
        } catch (error) {
            throw new Error(`Erreur lors de la création du document: ${error.message}`);
        }
    }

    // Récupérer un document par ID (actif uniquement)
    static async findById(id) {
        const query = `
            SELECT dm.*,
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   u.nom_utilisateur as upload_par_nom,
                   fm.id_fiche,
                   rv.id_rdv
            FROM documents_medicaux dm
            LEFT JOIN patients p ON dm.patient_id = p.id_patient
            LEFT JOIN utilisateurs u ON dm.upload_par = u.id_user
            LEFT JOIN fiches_medicales fm ON dm.fiche_medicale_id = fm.id_fiche
            LEFT JOIN rendez_vous rv ON dm.rendez_vous_id = rv.id_rdv
            WHERE dm.id_document = ? AND dm.statut = 'actif'
        `;

        try {
            const documents = await executeQuery(query, [id]);
            return documents[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du document: ${error.message}`);
        }
    }

    // Récupérer un document par ID (tous statuts, pour administration)
    static async findByIdAllStatus(id) {
        const query = `
            SELECT dm.*,
                   p.nom as patient_nom, p.prenom as patient_prenom,
                   u.nom_utilisateur as upload_par_nom,
                   fm.id_fiche,
                   rv.id_rdv
            FROM documents_medicaux dm
            LEFT JOIN patients p ON dm.patient_id = p.id_patient
            LEFT JOIN utilisateurs u ON dm.upload_par = u.id_user
            LEFT JOIN fiches_medicales fm ON dm.fiche_medicale_id = fm.id_fiche
            LEFT JOIN rendez_vous rv ON dm.rendez_vous_id = rv.id_rdv
            WHERE dm.id_document = ?
        `;

        try {
            const documents = await executeQuery(query, [id]);
            return documents[0] || null;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du document: ${error.message}`);
        }
    }

    // Récupérer tous les documents d'un patient
    static async findByPatientId(patient_id, filters = {}) {
        let query = `
            SELECT dm.*,
                   u.nom_utilisateur as upload_par_nom,
                   fm.id_fiche,
                   rv.id_rdv
            FROM documents_medicaux dm
            LEFT JOIN utilisateurs u ON dm.upload_par = u.id_user
            LEFT JOIN fiches_medicales fm ON dm.fiche_medicale_id = fm.id_fiche
            LEFT JOIN rendez_vous rv ON dm.rendez_vous_id = rv.id_rdv
            WHERE dm.patient_id = ? AND dm.statut = 'actif'
        `;

        const params = [patient_id];

        if (filters.type_document) {
            query += ` AND dm.type_document = ?`;
            params.push(filters.type_document);
        }

        if (filters.fiche_medicale_id) {
            query += ` AND dm.fiche_medicale_id = ?`;
            params.push(filters.fiche_medicale_id);
        }

        if (filters.date_debut) {
            query += ` AND DATE(dm.date_upload) >= ?`;
            params.push(filters.date_debut);
        }

        if (filters.date_fin) {
            query += ` AND DATE(dm.date_upload) <= ?`;
            params.push(filters.date_fin);
        }

        query += ` ORDER BY dm.date_upload DESC`;

        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(filters.limit);
        }

        try {
            return await executeQuery(query, params);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des documents: ${error.message}`);
        }
    }

    // Récupérer les documents d'une fiche médicale
    static async findByFicheMedicaleId(fiche_medicale_id) {
        const query = `
            SELECT dm.*,
                   u.nom_utilisateur as upload_par_nom
            FROM documents_medicaux dm
            LEFT JOIN utilisateurs u ON dm.upload_par = u.id_user
            WHERE dm.fiche_medicale_id = ? AND dm.statut = 'actif'
            ORDER BY dm.date_upload DESC
        `;

        try {
            return await executeQuery(query, [fiche_medicale_id]);
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des documents: ${error.message}`);
        }
    }

    // Supprimer un document (soft delete)
    static async delete(id) {
        try {
            // Récupérer le document AVANT de le supprimer (car findById filtre par statut='actif')
            const documentQuery = `
                SELECT nom_fichier, chemin_fichier 
                FROM documents_medicaux 
                WHERE id_document = ? AND statut = 'actif'
            `;
            const documents = await executeQuery(documentQuery, [id]);
            
            if (documents.length === 0) {
                throw new Error('Document non trouvé');
            }
            
            const document = documents[0];
            
            // Mettre à jour le statut
            const updateQuery = `
                UPDATE documents_medicaux 
                SET statut = 'supprime', updated_at = NOW()
                WHERE id_document = ?
            `;
            
            const result = await executeQuery(updateQuery, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Erreur lors de la mise à jour du statut');
            }

            // Supprimer le fichier physique
            if (document && document.nom_fichier) {
                const filePath = path.resolve(UPLOAD_DIR, document.nom_fichier);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (fileError) {
                        console.error('⚠️  Erreur suppression fichier physique:', fileError.message);
                        // Ne pas faire échouer la suppression si le fichier n'existe pas
                    }
                }
            }

            return { message: 'Document supprimé avec succès' };
        } catch (error) {
            throw new Error(`Erreur lors de la suppression du document: ${error.message}`);
        }
    }

    // Vérifier l'existence du fichier
    static async fileExists(documentId) {
        const document = await this.findById(documentId);
        if (!document) return false;

        const filePath = path.resolve(UPLOAD_DIR, document.nom_fichier);
        return fs.existsSync(filePath);
    }

    // Obtenir le chemin complet du fichier
    static async getFilePath(documentId) {
        const document = await this.findById(documentId);
        if (!document) {
            throw new Error('Document non trouvé ou supprimé');
        }

        // Utiliser path.resolve pour garantir un chemin absolu (requis pour res.sendFile)
        const filePath = path.resolve(UPLOAD_DIR, document.nom_fichier);
        if (!fs.existsSync(filePath)) {
            throw new Error('Fichier physique non trouvé sur le serveur');
        }

        return {
            path: filePath,
            filename: document.nom_fichier_original,
            type: document.type_fichier
        };
    }
}

module.exports = DocumentMedical;

