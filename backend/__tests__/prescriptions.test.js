const request = require('supertest');

// Mock Prescription model
jest.mock('../src/models/Prescription', () => ({
  create: jest.fn().mockResolvedValue({
    id_prescription: 123,
    fiche_medicale_id: 1,
    medicament_id: 1,
    dosage_prescrit: '500mg',
    frequence: '3 fois par jour',
    duree_traitement: 7,
    statut: 'active'
  }),
  createMultiple: jest.fn().mockResolvedValue([
    { id_prescription: 123, medicament_id: 1 },
    { id_prescription: 124, medicament_id: 2 }
  ]),
  findById: jest.fn().mockResolvedValue({
    id_prescription: 123,
    fiche_medicale_id: 1,
    medicament_id: 1,
    nom_commercial: 'Paracétamol 500mg',
    dosage_prescrit: '500mg',
    frequence: '3 fois par jour',
    statut: 'active'
  }),
  findByPatientId: jest.fn().mockResolvedValue([
    { id_prescription: 123, nom_commercial: 'Paracétamol 500mg', statut: 'active' }
  ]),
  getActivePrescriptions: jest.fn().mockResolvedValue([
    { id_prescription: 123, nom_commercial: 'Paracétamol 500mg', statut: 'active' }
  ]),
  findByFicheMedicaleId: jest.fn().mockResolvedValue([
    { id_prescription: 123, nom_commercial: 'Paracétamol 500mg' }
  ]),
  update: jest.fn().mockResolvedValue({ id_prescription: 123, statut: 'terminee' }),
  arreter: jest.fn().mockResolvedValue({ message: 'Prescription arrêtée' }),
  suspendre: jest.fn().mockResolvedValue({ message: 'Prescription suspendue' }),
  terminer: jest.fn().mockResolvedValue({ message: 'Prescription terminée' }),
  delete: jest.fn().mockResolvedValue({ message: 'Prescription supprimée' }),
  checkInteractionsForPatient: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(1),
  getStatistiques: jest.fn().mockResolvedValue({ total_prescriptions: 10 })
}));

const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');

describe('Prescriptions API (mocked)', () => {
  const adminToken = signTestToken({ id: 1, role: 'admin', username: 'admin' });
  const medecinToken = signTestToken({ id: 2, role: 'medecin', username: 'doc' });

  it('POST /api/prescriptions should create a prescription (medecin)', async () => {
    const payload = {
      fiche_medicale_id: 1,
      medicament_id: 1,
      dosage_prescrit: '500mg',
      frequence: '3 fois par jour',
      duree_traitement: 7,
      quantite_totale: 21,
      date_debut: '2024-01-15',
      date_fin: '2024-01-22'
    };

    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send(payload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/prescriptions/multiple should create multiple prescriptions (medecin)', async () => {
    const payload = {
      prescriptions: [
        {
          fiche_medicale_id: 1,
          medicament_id: 1,
          dosage_prescrit: '500mg',
          frequence: '3 fois par jour',
          duree_traitement: 7,
          quantite_totale: 21,
          date_debut: '2024-01-15',
          date_fin: '2024-01-22'
        },
        {
          fiche_medicale_id: 1,
          medicament_id: 2,
          dosage_prescrit: '20mg',
          frequence: '1 fois par jour',
          duree_traitement: 30,
          quantite_totale: 30,
          date_debut: '2024-01-15',
          date_fin: '2024-02-14'
        }
      ]
    };

    const res = await request(app)
      .post('/api/prescriptions/multiple')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send(payload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/prescriptions/:id should get prescription by id (medecin)', async () => {
    const res = await request(app)
      .get('/api/prescriptions/123')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/prescriptions/patient/:patient_id should get prescriptions by patient (medecin)', async () => {
    const res = await request(app)
      .get('/api/prescriptions/patient/1?page=1&limit=10')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('GET /api/prescriptions/patient/:patient_id/actives should get active prescriptions (medecin)', async () => {
    const res = await request(app)
      .get('/api/prescriptions/patient/1/actives')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/prescriptions/patient/:patient_id/interactions should check interactions (medecin)', async () => {
    const res = await request(app)
      .get('/api/prescriptions/patient/1/interactions')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/prescriptions/fiche/:fiche_medicale_id should get prescriptions by fiche (medecin)', async () => {
    const res = await request(app)
      .get('/api/prescriptions/fiche/1')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('PUT /api/prescriptions/:id should update prescription (medecin)', async () => {
    const res = await request(app)
      .put('/api/prescriptions/123')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send({ statut: 'terminee' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/prescriptions/:id/arreter should stop prescription (medecin)', async () => {
    const res = await request(app)
      .post('/api/prescriptions/123/arreter')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send({ raison: 'Effets secondaires' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/prescriptions/:id/suspendre should suspend prescription (medecin)', async () => {
    const res = await request(app)
      .post('/api/prescriptions/123/suspendre')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send({ raison: 'Pause temporaire' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/prescriptions/:id/terminer should finish prescription (medecin)', async () => {
    const res = await request(app)
      .post('/api/prescriptions/123/terminer')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/prescriptions/:id/renouveler should renew prescription (medecin)', async () => {
    const res = await request(app)
      .post('/api/prescriptions/123/renouveler')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send({
        nouvelle_duree: 14,
        nouvelle_quantite: 42,
        date_debut: '2024-01-22'
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
  });

  it('GET /api/prescriptions/patient/:patient_id/fiche/:fiche_medicale_id/ordonnance should generate ordonnance (medecin)', async () => {
    const res = await request(app)
      .get('/api/prescriptions/patient/1/fiche/1/ordonnance')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/prescriptions/statistiques should get statistics (admin)', async () => {
    const res = await request(app)
      .get('/api/prescriptions/statistiques')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('DELETE /api/prescriptions/:id should delete prescription (medecin)', async () => {
    const res = await request(app)
      .delete('/api/prescriptions/123')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should reject non-medecin access for creation', async () => {
    const personnelToken = signTestToken({ id: 3, role: 'personnel', username: 'personnel' });
    
    const res = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', `Bearer ${personnelToken}`)
      .send({
        fiche_medicale_id: 1,
        medicament_id: 1,
        dosage_prescrit: '500mg',
        frequence: '3 fois par jour',
        duree_traitement: 7,
        quantite_totale: 21,
        date_debut: '2024-01-15',
        date_fin: '2024-01-22'
      });

    expect([401, 403]).toContain(res.status);
  });
});
