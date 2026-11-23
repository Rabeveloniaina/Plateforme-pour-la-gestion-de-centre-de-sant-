/**
 * Utilitaires de formatage de dates pour le backend
 * IMPORTANT: Éviter toISOString() qui convertit en UTC
 */

/**
 * Formate une date JavaScript en format MySQL DATETIME (en heure LOCAL)
 * @param {Date} date - Date à formater
 * @returns {string} Format 'YYYY-MM-DD HH:MM:SS' en heure locale
 */
function formatDateTimeForMySQL(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Date invalide');
    }
    
    // NE PAS utiliser toISOString() qui convertit en UTC !
    // Formater manuellement en LOCAL
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formate une date JavaScript en format MySQL DATE (en heure LOCAL)
 * @param {Date} date - Date à formater
 * @returns {string} Format 'YYYY-MM-DD' en heure locale
 */
function formatDateForMySQL(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Date invalide');
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Formate une heure en format MySQL TIME (en heure LOCAL)
 * @param {Date} date - Date dont on veut extraire l'heure
 * @returns {string} Format 'HH:MM:SS' en heure locale
 */
function formatTimeForMySQL(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Date invalide');
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

module.exports = {
    formatDateTimeForMySQL,
    formatDateForMySQL,
    formatTimeForMySQL
};

