const request = require('supertest');

// Mock Medicament model
jest.mock('../src/models/Medicament', () => ({
  create: jest.fn().mockResolvedValue({
    id_medicament: 123,
    nom_commercial: 'Paracétamol 500mg',
    denomination_commune: 'Paracétamol',
    forme_pharmaceutique: 'comprime',
    dosage: '500',
    unite_dosage: 'mg'
  }),
  findById: jest.fn().mockResolvedValue({
    id_medicament: 123,
    nom_commercial: 'Paracétamol 500mg',
    denomination_commune: 'Paracétamol',
    forme_pharmaceutique: 'comprime',
    dosage: '500',
    unite_dosage: 'mg',
    statut: 'actif'
  }),
  findAll: jest.fn().mockResolvedValue([
    { id_medicament: 123, nom_commercial: 'Paracétamol 500mg', statut: 'actif' }
  ]),
  update: jest.fn().mockResolvedValue({ id_medicament: 123, statut: 'inactif' }),
  delete: jest.fn().mockResolvedValue({ message: 'Médicament désactivé' }),
  search: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(1),
  getStatistiques: jest.fn().mockResolvedValue([{ total_medicaments: 10 }]),
  findByForme: jest.fn().mockResolvedValue([]),
  checkInteractions: jest.fn().mockResolvedValue([])
}));

const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');

describe('Medicaments API (mocked)', () => {
  const adminToken = signTestToken({ id: 1, role: 'admin', username: 'admin' });
  const medecinToken = signTestToken({ id: 2, role: 'medecin', username: 'doc' });

  it('POST /api/medicaments should create a medicament (admin)', async () => {
    const payload = {
      nom_commercial: 'Paracétamol 500mg',
      denomination_commune: 'Paracétamol',
      forme_pharmaceutique: 'comprime',
      dosage: '500',
      unite_dosage: 'mg',
      fabricant: 'Laboratoire Test'
    };

    const res = await request(app)
      .post('/api/medicaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/medicaments should list medicaments (medecin)', async () => {
    const res = await request(app)
      .get('/api/medicaments?page=1&limit=10')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('GET /api/medicaments/:id should get medicament by id (medecin)', async () => {
    const res = await request(app)
      .get('/api/medicaments/123')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/medicaments/search should search medicaments (medecin)', async () => {
    const res = await request(app)
      .get('/api/medicaments/search?q=paracetamol')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('PUT /api/medicaments/:id should update medicament (admin)', async () => {
    const res = await request(app)
      .put('/api/medicaments/123')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statut: 'inactif' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/medicaments/interactions should check interactions (medecin)', async () => {
    const res = await request(app)
      .post('/api/medicaments/interactions')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send({ medicament_ids: [1, 2, 3] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/medicaments/forme/:forme should get by forme (medecin)', async () => {
    const res = await request(app)
      .get('/api/medicaments/forme/comprime')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/medicaments/statistiques should get statistics (admin)', async () => {
    const res = await request(app)
      .get('/api/medicaments/statistiques')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/medicaments/import should import bulk medicaments (admin)', async () => {
    const payload = {
      medicaments: [
        {
          nom_commercial: 'Test Med 1',
          denomination_commune: 'Test',
          forme_pharmaceutique: 'comprime',
          dosage: '100',
          unite_dosage: 'mg'
        },
        {
          nom_commercial: 'Test Med 2',
          denomination_commune: 'Test 2',
          forme_pharmaceutique: 'gelule',
          dosage: '200',
          unite_dosage: 'mg'
        }
      ]
    };

    const res = await request(app)
      .post('/api/medicaments/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('DELETE /api/medicaments/:id should delete medicament (admin only)', async () => {
    const res = await request(app)
      .delete('/api/medicaments/123')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should reject non-admin access for creation', async () => {
    const personnelToken = signTestToken({ id: 3, role: 'personnel', username: 'personnel' });
    
    const res = await request(app)
      .post('/api/medicaments')
      .set('Authorization', `Bearer ${personnelToken}`)
      .send({
        nom_commercial: 'Test',
        denomination_commune: 'Test',
        forme_pharmaceutique: 'comprime',
        dosage: '100',
        unite_dosage: 'mg'
      });

    expect([401, 403]).toContain(res.status);
  });
});
