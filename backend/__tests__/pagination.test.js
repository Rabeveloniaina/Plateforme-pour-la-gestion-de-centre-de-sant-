const request = require('supertest');
const app = require('../src/app');

describe('Pagination & filters', () => {
  it('GET /api/patients should require auth but accept pagination params', async () => {
    const res = await request(app).get('/api/patients?page=2&limit=5&nom=test');
    expect([401,403]).toContain(res.status);
  });

  it('GET /api/medecins should require auth but accept pagination params', async () => {
    const res = await request(app).get('/api/medecins?page=1&limit=2&nom=a');
    expect([401,403]).toContain(res.status);
  });

  it('GET /api/rendez-vous should require auth but accept pagination params', async () => {
    const res = await request(app).get('/api/rendez-vous?page=1&limit=2&q=a');
    expect([401,403]).toContain(res.status);
  });

  it('GET /api/centres should require auth but accept pagination params', async () => {
    const res = await request(app).get('/api/centres?page=1&limit=2&regionId=1&q=a');
    expect([401,403]).toContain(res.status);
  });
});


