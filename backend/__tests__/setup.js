/**
 * Configuration globale pour les tests Jest
 * Ce fichier est exécuté avant chaque suite de tests
 */

// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret_jwt_plateforme_sante_2024_dev';
process.env.DB_NAME = process.env.DB_TEST_NAME || 'sante_db_test';

// Augmenter le timeout par défaut pour les tests asynchrones
jest.setTimeout(30000);

// Mock console pour réduire le bruit dans les tests (optionnel)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Configuration globale avant tous les tests
beforeAll(() => {
  // Ici on peut ajouter du setup global si nécessaire
  // Par exemple : connexion à une base de données de test
});

// Nettoyage après tous les tests
afterAll(() => {
  // Ici on peut ajouter du cleanup global si nécessaire
  // Par exemple : fermeture de connexions
});

