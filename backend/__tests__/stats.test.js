const request = require('supertest');
const app = require('../src/app');

describe('Stats endpoints (smoke)', () => {
  it('GET /health is ok (precondition)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('GET /api/statistiques/region requires auth/admin', async () => {
    const res = await request(app).get('/api/statistiques/region?periode=jour');
    expect([401,403]).toContain(res.status);
  });
});


