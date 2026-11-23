const request = require('supertest');

jest.mock('../src/models/Notification', () => ({
  create: jest.fn().mockResolvedValue({ id_notification: 5, type: 'sms', message: 'Test', statut: 'cree' }),
  list: jest.fn().mockResolvedValue([{ id_notification: 5, type: 'sms', message: 'Test', statut: 'cree' }]),
  updateStatut: jest.fn().mockResolvedValue({ message: 'Statut mis à jour' }),
  count: jest.fn().mockResolvedValue(1)
}));

const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');

describe('Notifications API (mocked)', () => {
  const personnelToken = signTestToken({ id: 2, role: 'personnel', username: 'pers' });

  it('POST /api/notifications should create a notification', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${personnelToken}`)
      .send({ type: 'SMS', message: 'Test' });
    expect([200,201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/notifications should list notifications', async () => {
    const res = await request(app)
      .get('/api/notifications?page=1&limit=10')
      .set('Authorization', `Bearer ${personnelToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /api/notifications/:id/statut should update statut', async () => {
    const res = await request(app)
      .put('/api/notifications/5/statut')
      .set('Authorization', `Bearer ${personnelToken}`)
      .send({ statut: 'envoye' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});


