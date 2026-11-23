const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données avec valeurs par défaut
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sante_db',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00',
    // Pool de connexions
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de connexion
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connexion à la base de données MySQL établie avec succès');
        console.log(`   📊 Base: ${dbConfig.database} sur ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error.message);
        console.log('💡 Vérifiez que:');
        console.log('   1. XAMPP est démarré et MySQL est actif');
        console.log('   2. La base de données "sante_db" existe');
        console.log('   3. Les scripts SQL ont été exécutés');
        return false;
    }
};

// Fonction pour exécuter des requêtes
const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('❌ Erreur d\'exécution de requête:', error.message);
        throw error;
    }
};

// Fonction pour exécuter des requêtes avec transaction
const executeTransaction = async (queries) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params = [] } of queries) {
            const [rows] = await connection.execute(query, params);
            results.push(rows);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    testConnection,
    executeQuery,
    executeTransaction,
    dbConfig
};
