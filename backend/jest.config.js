module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  collectCoverage: true, // Activer la collecte de couverture
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/scripts/',
    '/coverage/',
    '/src/config/',
    '/src/server.js',
    '/src/app.js'
  ],
  // Variables d'environnement pour les tests
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  // Timeout pour les tests (30 secondes)
  testTimeout: 30000,
  // Ignorer certains dossiers
  testPathIgnorePatterns: [
    '/node_modules/',
    '/scripts/'
  ]
};
