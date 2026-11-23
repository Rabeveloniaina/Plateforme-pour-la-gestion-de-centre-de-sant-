const request = require('supertest');

// Mock Vaccination model
jest.mock('../src/models/Vaccination', () => ({
  create: jest.fn().mockResolvedValue({
    id_vaccination: 123,
    patient_id: 1,
    medecin_id: 1,
    nom_vaccin: 'Tétanos-Diphtérie',
    type_vaccin: 'obligatoire',
    date_administration: '2024-01-15',
    statut: 'administre'
  }),
  findById: jest.fn().mockResolvedValue({
    id_vaccination: 123,
    patient_id: 1,
    medecin_id: 1,
    nom_vaccin: 'Tétanos-Diphtérie',
    type_vaccin: 'obligatoire',
    patient_nom: 'Doe',
    patient_prenom: 'John',
    medecin_nom: 'Dr. Smith'
  }),
  findByPatientId: jest.fn().mockResolvedValue([
    { id_vaccination: 123, nom_vaccin: 'Tétanos-Diphtérie', date_administration: '2024-01-15' }
  ]),
  findByMedecinId: jest.fn().mockResolvedValue([
    { id_vaccination: 123, nom_vaccin: 'Tétanos-Diphtérie', patient_nom: 'Doe' }
  ]),
  getCarnetVaccination: jest.fn().mockResolvedValue([
    { id_vaccination: 123, nom_vaccin: 'Tétanos-Diphtérie', date_administration: '2024-01-15' }
  ]),
  checkStatutVaccinal: jest.fn().mockResolvedValue({
    patient_id: 1,
    vaccins_a_jour: ['Tétanos-Diphtérie'],
    vaccins_manquants: ['BCG'],
    vaccins_en_retard: []
  }),
  getRappelsAVenir: jest.fn().mockResolvedValue([
    { id_vaccination: 123, nom_vaccin: 'Tétanos-Diphtérie', date_rappel_prevu: '2025-01-15' }
  ]),
  update: jest.fn().mockResolvedValue({ id_vaccination: 123, reactions_adverses: 'Aucune' }),
  delete: jest.fn().mockResolvedValue({ message: 'Vaccination supprimée' }),
  search: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(1),
  getStatistiques: jest.fn().mockResolvedValue([{ type_vaccin: 'obligatoire', count_by_type: 5 }]),
  getCouvertureVaccinale: jest.fn().mockResolvedValue([
    { nom_vaccin: 'Tétanos-Diphtérie', taux_couverture: 85.5 }
  ])
}));

const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');

describe('Vaccinations API (mocked)', () => {
  const adminToken = signTestToken({ id: 1, role: 'admin', username: 'admin' });
  const medecinToken = signTestToken({ id: 2, role: 'medecin', username: 'doc' });
  const personnelToken = signTestToken({ id: 3, role: 'personnel', username: 'personnel' });

  it('POST /api/vaccinations should create a vaccination (medecin)', async () => {
    const payload = {
      patient_id: 1,
      medecin_id: 1,
      nom_vaccin: 'Tétanos-Diphtérie',
      type_vaccin: 'obligatoire',
      date_administration: '2024-01-15',
      site_injection: 'bras_gauche',
      voie_administration: 'intramusculaire'
    };

    const res = await request(app)
      .post('/api/vaccinations')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send(payload);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/vaccinations/:id should get vaccination by id (medecin)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/123')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/vaccinations/patient/:patient_id should get vaccinations by patient (personnel)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/patient/1?page=1&limit=10')
      .set('Authorization', `Bearer ${personnelToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('GET /api/vaccinations/patient/:patient_id/carnet should get vaccination card (personnel)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/patient/1/carnet')
      .set('Authorization', `Bearer ${personnelToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('vaccinations');
  });

  it('POST /api/vaccinations/patient/:patient_id/statut-vaccinal should check vaccination status (medecin)', async () => {
    const payload = {
      vaccins_obligatoires: ['Tétanos-Diphtérie', 'BCG', 'Polio']
    };

    const res = await request(app)
      .post('/api/vaccinations/patient/1/statut-vaccinal')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('vaccins_a_jour');
    expect(res.body.data).toHaveProperty('vaccins_manquants');
  });

  it('GET /api/vaccinations/medecin/:medecin_id should get vaccinations by medecin (medecin)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/medecin/1?page=1&limit=10')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('GET /api/vaccinations/rappels should get upcoming reminders (personnel)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/rappels?centre_id=1&jours_avance=30')
      .set('Authorization', `Bearer ${personnelToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('PUT /api/vaccinations/:id should update vaccination (personnel)', async () => {
    const res = await request(app)
      .put('/api/vaccinations/123')
      .set('Authorization', `Bearer ${personnelToken}`)
      .send({ reactions_adverses: 'Légère rougeur au site d\'injection' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/vaccinations/:id/planifier-rappel should schedule reminder (medecin)', async () => {
    const res = await request(app)
      .post('/api/vaccinations/123/planifier-rappel')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send({ date_rappel_prevu: '2025-01-15' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/vaccinations/:id/reaction-adverse should record adverse reaction (personnel)', async () => {
    const res = await request(app)
      .post('/api/vaccinations/123/reaction-adverse')
      .set('Authorization', `Bearer ${personnelToken}`)
      .send({ reactions_adverses: 'Fièvre légère pendant 24h' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('GET /api/vaccinations/search should search vaccinations (medecin)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/search?q=tetanos')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/vaccinations/statistiques should get statistics (admin)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/statistiques')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/vaccinations/couverture should get vaccination coverage (admin)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/couverture?centre_id=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/vaccinations/types should get vaccine types (medecin)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/types')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('GET /api/vaccinations/sites-injection should get injection sites (medecin)', async () => {
    const res = await request(app)
      .get('/api/vaccinations/sites-injection')
      .set('Authorization', `Bearer ${medecinToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('DELETE /api/vaccinations/:id should delete vaccination (admin only)', async () => {
    const res = await request(app)
      .delete('/api/vaccinations/123')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should reject patient access for creation', async () => {
    const patientToken = signTestToken({ id: 4, role: 'patient', username: 'patient' });
    
    const res = await request(app)
      .post('/api/vaccinations')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        patient_id: 1,
        medecin_id: 1,
        nom_vaccin: 'Test',
        type_vaccin: 'obligatoire',
        date_administration: '2024-01-15',
        site_injection: 'bras_gauche',
        voie_administration: 'intramusculaire'
      });

    expect([401, 403]).toContain(res.status);
  });
});
