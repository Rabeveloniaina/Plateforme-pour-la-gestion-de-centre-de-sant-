const request = require('supertest');
// Mock Patient model to avoid real DB dependency in CRUD tests
jest.mock('../src/models/Patient', () => ({
  create: jest.fn().mockResolvedValue({
    id_patient: 123,
    nom: 'Doe', prenom: 'Jane', date_naissance: '1990-01-01', sexe: 'F', adresse: 'Rue 1', telephone: '0000', centre_id: 1
  }),
  findAll: jest.fn().mockResolvedValue([
    { id_patient: 123, nom: 'Doe', prenom: 'Jane', centre_id: 1 }
  ]),
  count: jest.fn().mockResolvedValue(1),
  findById: jest.fn().mockResolvedValue({ id_patient: 123, nom: 'Doe', prenom: 'Jane' }),
  update: jest.fn().mockResolvedValue({ id_patient: 123, allergies: 'penicilline' }),
  delete: jest.fn().mockResolvedValue({ message: 'Patient supprimé' })
}));

const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');

describe('Patients CRUD (authenticated)', () => {
  const adminToken = signTestToken({ id: 1, role: 'admin', username: 'admin' });
  let createdId;

  it('POST /api/patients should create a patient (admin)', async () => {
    const payload = {
      nom: 'Doe',
      prenom: 'Jane',
      date_naissance: '1990-01-01',
      sexe: 'F',
      adresse: 'Rue 1',
      telephone: '0000',
      centre_id: 1
    };
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect([200,201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    createdId = res.body.data.id_patient || res.body.data.id || res.body.data.id_patients;
  });

  it('GET /api/patients should list patients (admin)', async () => {
    const res = await request(app)
      .get('/api/patients?limit=5&page=1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('PUT /api/patients/:id should update patient (admin)', async () => {
    const id = createdId || 1;
    const res = await request(app)
      .put(`/api/patients/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ allergies: 'penicilline' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('DELETE /api/patients/:id should soft delete patient (admin)', async () => {
    const id = createdId || 1;
    const res = await request(app)
      .delete(`/api/patients/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});


