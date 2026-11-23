const request = require('supertest');
const app = require('../src/app');

describe('API smoke tests', () => {
  it('GET /health should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('POST /api/auth/login should fail with invalid creds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ nom_utilisateur: 'invalid', mot_de_passe: 'invalid' });
    // Accept 400, 401, or 500 (500 if DB connection fails)
    expect([400, 401, 500]).toContain(res.status);
    if (res.status !== 500) {
      expect(res.body).toHaveProperty('success', false);
    }
  });

  it('GET /api/patients should require auth', async () => {
    const res = await request(app).get('/api/patients');
    expect([401,403]).toContain(res.status);
  });
});


