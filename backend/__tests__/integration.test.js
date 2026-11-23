const request = require('supertest');
const app = require('../src/app');

describe('Integration (auth flow + protected)', () => {
  it('login without body -> 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('invalid login -> 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ nom_utilisateur: 'nope', mot_de_passe: 'nope' });
    expect([400,401]).toContain(res.status);
  });

  it('protected route without token -> 401/403', async () => {
    const res = await request(app).get('/api/patients');
    expect([401,403]).toContain(res.status);
  });
});


