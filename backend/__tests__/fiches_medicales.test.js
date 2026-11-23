const request = require('supertest');

// Mock FicheMedicale model
jest.mock('../src/models/FicheMedicale', () => ({
  create: jest.fn().mockResolvedValue({
    id_fiche: 123,
    patient_id: 1,
    medecin_id: 1,
    date_consultation: '2024-01-15T09:00:00Z',
    motif_consultation: 'Contrôle de routine',
    diagnostic_principal: 'Bilan normal'
  }),
  findById: jest.fn().mockResolvedValue({
    id_fiche: 123,
    patient_id: 1,
    medecin_id: 1,
    patient_nom: 'Doe',
    patient_prenom: 'John',
    medecin_nom: 'Dr. Smith',
    medecin_prenom: 'Jane',
    diagnostic_principal: 'Bilan normal'
  }),
  findByPatientId: jest.fn().mockResolvedValue([
    { id_fiche: 123, diagnostic_principal: 'Bilan normal', date_consultation: '2024-01-15T09:00:00Z' }
  ]),
  update: jest.fn().mockResolvedValue({ id_fiche: 123, diagnostic_principal: 'Mis à jour' }),
  delete: jest.fn().mockResolvedValue({ message: 'Fiche supprimée' }),
  count: jest.fn().mockResolvedValue(1),
  search: jest.fn().mockResolvedValue([]),
  getStatistiques: jest.fn().mockResolvedValue({ total_consultations: 5 })
}));

// Mock Prescription model
jest.mock('../src/models/Prescription', () => ({
  findByFicheMedicaleId: jest.fn().mockResolvedValue([]),
  createMultiple: jest.fn().mockResolvedValue([])
}));

const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');

describe('Fiches Médicales API (mocked)', () => {
  const adminToken = signTestToken({ id: 1, role: 'admin', username: 'admin' });
  const medecinToken = signTestToken({ id: 2, role: 'medecin', username: 'doc' });

  it('POST /api/fiches-medicales should create a fiche medicale (medecin)', async () => {
    const payload = {
      patient_id: 1,
      medecin_id: 1,
      date_consultation: '2024-01-15T09:00:00Z',
      motif_consultation: 'Contrôle de routine',
      diagnostic_principal: 'Bilan normal'
    };

    const res = await request(app)
      .post('/api/fiches-medicales')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send(payload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/fiches-medicales/:id should get fiche by id (medecin)', async () => {
    const res = await request(app)
      .get('/api/fiches-medicales/123')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/fiches-medicales/patient/:patient_id should get fiches by patient (medecin)', async () => {
    const res = await request(app)
      .get('/api/fiches-medicales/patient/1?page=1&limit=10')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('PUT /api/fiches-medicales/:id should update fiche (medecin)', async () => {
    const res = await request(app)
      .put('/api/fiches-medicales/123')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send({ diagnostic_principal: 'Mis à jour' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/fiches-medicales/with-prescriptions should create fiche with prescriptions (medecin)', async () => {
    const payload = {
      fiche_data: {
        patient_id: 1,
        medecin_id: 1,
        date_consultation: '2024-01-15T09:00:00Z',
        motif_consultation: 'Contrôle avec prescription'
      },
      prescriptions: [
        {
          medicament_id: 1,
          dosage_prescrit: '500mg',
          frequence: '3 fois par jour',
          duree_traitement: 7,
          quantite_totale: 21,
          date_debut: '2024-01-15',
          date_fin: '2024-01-22'
        }
      ]
    };

    const res = await request(app)
      .post('/api/fiches-medicales/with-prescriptions')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send(payload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
  });

  it('GET /api/fiches-medicales/statistiques should get statistics (admin)', async () => {
    const res = await request(app)
      .get('/api/fiches-medicales/statistiques')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('DELETE /api/fiches-medicales/:id should delete fiche (admin only)', async () => {
    const res = await request(app)
      .delete('/api/fiches-medicales/123')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should reject access without proper role', async () => {
    const patientToken = signTestToken({ id: 3, role: 'patient', username: 'patient' });
    
    const res = await request(app)
      .post('/api/fiches-medicales')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        patient_id: 1,
        medecin_id: 1,
        date_consultation: '2024-01-15T09:00:00Z',
        motif_consultation: 'Test'
      });

    expect([401, 403]).toContain(res.status);
  });
});
