const request = require('supertest');
const app = require('../src/app');

describe('Protected endpoints', () => {
  it('should reject /api/medecins without auth', async () => {
    const res = await request(app).get('/api/medecins');
    expect([401,403]).toContain(res.status);
  });

  it('should reject /api/statistiques/centre without admin', async () => {
    const res = await request(app).get('/api/statistiques/centre');
    expect([401,403]).toContain(res.status);
  });
});


