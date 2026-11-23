/**
 * Configuration Multer pour l'upload de fichiers
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Dossier de stockage des documents
const UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('✅ Dossier uploads créé:', UPLOAD_DIR);
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Générer un nom de fichier unique : UUID + extension originale
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Filtre des types de fichiers autorisés
const fileFilter = (req, file, cb) => {
    // Types de fichiers autorisés pour documents médicaux
    const allowedMimes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        // PDF
        'application/pdf',
        // Documents
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Excel
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Types autorisés: ${allowedMimes.join(', ')}`), false);
    }
};

// Configuration Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB maximum
        files: 5 // Maximum 5 fichiers par requête
    }
});

// Middleware pour upload unique
const uploadSingle = upload.single('document');

// Middleware pour upload multiple
const uploadMultiple = upload.array('documents', 5);

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    UPLOAD_DIR
};

