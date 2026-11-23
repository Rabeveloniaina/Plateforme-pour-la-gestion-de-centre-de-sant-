/**
 * Contrôleur pour la gestion des documents médicaux
 */

const DocumentMedical = require('../models/DocumentMedical');
const { uploadSingle, uploadMultiple } = require('../config/upload');
const path = require('path');
const fs = require('fs');

class DocumentMedicalController {
    // Upload d'un seul document
    static async uploadSingle(req, res) {
        uploadSingle(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur lors de l\'upload',
                    error: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier fourni'
                });
            }

            try {
                const user = req.user;
                const { patient_id, fiche_medicale_id, rendez_vous_id, prescription_id, type_document, description, date_examen } = req.body;

                if (!patient_id) {
                    // Supprimer le fichier uploadé
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({
                        success: false,
                        message: 'patient_id est requis'
                    });
                }

                const documentData = {
                    fiche_medicale_id: fiche_medicale_id || null,
                    patient_id: parseInt(patient_id),
                    rendez_vous_id: rendez_vous_id || null,
                    prescription_id: prescription_id || null,
                    nom_fichier: req.file.filename,
                    nom_fichier_original: req.file.originalname,
                    chemin_fichier: req.file.path,
                    type_fichier: req.file.mimetype,
                    taille_fichier: req.file.size,
                    type_document: type_document || 'autre',
                    description: description || null,
                    upload_par: user.id,
                    date_examen: date_examen || null
                };

                const document = await DocumentMedical.create(documentData);

                res.status(201).json({
                    success: true,
                    message: 'Document uploadé avec succès',
                    data: document
                });

            } catch (error) {
                // Supprimer le fichier en cas d'erreur
                if (req.file && req.file.path) {
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (e) {
                        console.error('Erreur suppression fichier:', e);
                    }
                }

                console.error('❌ Erreur upload document:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'enregistrement du document',
                    error: error.message
                });
            }
        });
    }

    // Upload de plusieurs documents
    static async uploadMultiple(req, res) {
        uploadMultiple(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur lors de l\'upload',
                    error: err.message
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier fourni'
                });
            }

            try {
                const user = req.user;
                const { patient_id, fiche_medicale_id, rendez_vous_id, prescription_id, type_document, description } = req.body;

                if (!patient_id) {
                    // Supprimer tous les fichiers uploadés
                    req.files.forEach(file => {
                        try {
                            fs.unlinkSync(file.path);
                        } catch (e) {}
                    });
                    return res.status(400).json({
                        success: false,
                        message: 'patient_id est requis'
                    });
                }

                const documents = [];
                const errors = [];

                for (const file of req.files) {
                    try {
                        const documentData = {
                            fiche_medicale_id: fiche_medicale_id || null,
                            patient_id: parseInt(patient_id),
                            rendez_vous_id: rendez_vous_id || null,
                            prescription_id: prescription_id || null,
                            nom_fichier: file.filename,
                            nom_fichier_original: file.originalname,
                            chemin_fichier: file.path,
                            type_fichier: file.mimetype,
                            taille_fichier: file.size,
                            type_document: type_document || 'autre',
                            description: description || null,
                            upload_par: user.id
                        };

                        const document = await DocumentMedical.create(documentData);
                        documents.push(document);
                    } catch (error) {
                        // Supprimer le fichier en cas d'erreur
                        try {
                            fs.unlinkSync(file.path);
                        } catch (e) {}
                        errors.push({ file: file.originalname, error: error.message });
                    }
                }

                res.status(201).json({
                    success: true,
                    message: `${documents.length} document(s) uploadé(s) avec succès`,
                    data: documents,
                    errors: errors.length > 0 ? errors : undefined
                });

            } catch (error) {
                // Supprimer tous les fichiers en cas d'erreur
                if (req.files) {
                    req.files.forEach(file => {
                        try {
                            fs.unlinkSync(file.path);
                        } catch (e) {}
                    });
                }

                console.error('❌ Erreur upload documents:', error);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'enregistrement des documents',
                    error: error.message
                });
            }
        });
    }

    // Télécharger un document
    static async download(req, res) {
        try {
            const { id } = req.params;
            const fileInfo = await DocumentMedical.getFilePath(id);

            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.filename)}"`);
            res.setHeader('Content-Type', fileInfo.type);

            res.sendFile(fileInfo.path);
        } catch (error) {
            console.error('❌ Erreur téléchargement document:', error);
            res.status(404).json({
                success: false,
                message: 'Document non trouvé',
                error: error.message
            });
        }
    }

    // Voir un document (inline)
    static async view(req, res) {
        try {
            const { id } = req.params;
            const fileInfo = await DocumentMedical.getFilePath(id);

            res.setHeader('Content-Type', fileInfo.type);
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.filename)}"`);

            res.sendFile(fileInfo.path);
        } catch (error) {
            console.error('❌ Erreur visualisation document:', error);
            res.status(404).json({
                success: false,
                message: 'Document non trouvé',
                error: error.message
            });
        }
    }

    // Liste des documents d'un patient
    static async getByPatient(req, res) {
        try {
            const { patient_id } = req.params;
            const filters = {
                type_document: req.query.type_document,
                fiche_medicale_id: req.query.fiche_medicale_id,
                date_debut: req.query.date_debut,
                date_fin: req.query.date_fin,
                limit: req.query.limit ? parseInt(req.query.limit) : 50
            };

            // Nettoyer les filtres vides
            Object.keys(filters).forEach(key => {
                if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
                    delete filters[key];
                }
            });

            const documents = await DocumentMedical.findByPatientId(parseInt(patient_id), filters);

            res.json({
                success: true,
                data: documents,
                count: documents.length
            });
        } catch (error) {
            console.error('❌ Erreur récupération documents:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des documents',
                error: error.message
            });
        }
    }

    // Liste des documents d'une fiche médicale
    static async getByFiche(req, res) {
        try {
            const { fiche_id } = req.params;
            const documents = await DocumentMedical.findByFicheMedicaleId(parseInt(fiche_id));

            res.json({
                success: true,
                data: documents,
                count: documents.length
            });
        } catch (error) {
            console.error('❌ Erreur récupération documents:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des documents',
                error: error.message
            });
        }
    }

    // Obtenir un document par ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const document = await DocumentMedical.findById(id);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document non trouvé'
                });
            }

            res.json({
                success: true,
                data: document
            });
        } catch (error) {
            console.error('❌ Erreur récupération document:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du document',
                error: error.message
            });
        }
    }

    // Supprimer un document
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await DocumentMedical.delete(id);

            res.json({
                success: true,
                message: 'Document supprimé avec succès'
            });
        } catch (error) {
            console.error('❌ Erreur suppression document:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du document',
                error: error.message
            });
        }
    }
}

module.exports = DocumentMedicalController;

