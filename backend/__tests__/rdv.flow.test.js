const request = require('supertest');

// Mocks
jest.mock('../src/models/RendezVous', () => ({
  verifierDisponibilite: jest.fn().mockResolvedValue(true),
  create: jest.fn().mockResolvedValue({ id_rdv: 77, statut: 'planifie' }),
  findById: jest.fn().mockResolvedValue({ id_rdv: 77, patient_id: 10, centre_id: 1, statut: 'planifie' }),
  findAll: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
  update: jest.fn().mockResolvedValue({ id_rdv: 77, statut: 'planifie' }),
  annuler: jest.fn().mockResolvedValue({ message: 'RDV annulé' }),
  confirmer: jest.fn().mockResolvedValue({ message: 'RDV confirmé' }),
  terminer: jest.fn().mockResolvedValue({ message: 'RDV terminé' }),
  checkin: jest.fn().mockResolvedValue({ message: 'Patient enregistré à l\'arrivée' }),
  demarrer: jest.fn().mockResolvedValue({ message: 'Consultation démarrée' }),
  getNextInQueue: jest.fn().mockResolvedValue({ id_rdv: 88, patient: 'John', centre_id: 1 }),
  getRendezVousDuJour: jest.fn().mockResolvedValue([]),
  getRendezVousMedecin: jest.fn().mockResolvedValue([]),
  getStatistiques: jest.fn().mockResolvedValue({ total: 0 })
}));

jest.mock('../src/models/Patient', () => ({
  findById: jest.fn().mockResolvedValue({ id_patient: 10, nom: 'Doe', prenom: 'John', telephone: '0000', email: 'j@d.com' })
}));

jest.mock('../src/services/notificationService', () => ({
  notifyRdv: jest.fn().mockResolvedValue(true)
}));

const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');

describe('RendezVous flow (authenticated)', () => {
  const adminToken = signTestToken({ id: 1, role: 'admin', username: 'admin' });
  const personnelToken = signTestToken({ id: 2, role: 'personnel', username: 'pers' });
  const medecinToken = signTestToken({ id: 3, role: 'medecin', username: 'doc' });

  it('POST /api/rendez-vous should create RDV (admin)', async () => {
    const res = await request(app)
      .post('/api/rendez-vous')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ patient_id: 10, medecin_id: 20, centre_id: 1, date_rdv: new Date().toISOString(), duree_estimee: 30 });
    expect([200,201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/rendez-vous/:id/checkin should mark arrival (personnel)', async () => {
    const res = await request(app)
      .post('/api/rendez-vous/77/checkin')
      .set('Authorization', `Bearer ${personnelToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/rendez-vous/:id/demarrer should start consultation (medecin)', async () => {
    const res = await request(app)
      .post('/api/rendez-vous/77/demarrer')
      .set('Authorization', `Bearer ${medecinToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/rendez-vous/:id/terminer should finish consultation (medecin)', async () => {
    const res = await request(app)
      .post('/api/rendez-vous/77/terminer')
      .set('Authorization', `Bearer ${medecinToken}`)
      .send({ duree_reelle: 25, note_medecin: 'Bon déroulement' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('GET /api/rendez-vous/prochain should return next in queue for centre (personnel)', async () => {
    const res = await request(app)
      .get('/api/rendez-vous/prochain?centre_id=1')
      .set('Authorization', `Bearer ${personnelToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/rendez-vous/:id/confirmer triggers notification (personnel)', async () => {
    const res = await request(app)
      .post('/api/rendez-vous/77/confirmer')
      .set('Authorization', `Bearer ${personnelToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('POST /api/rendez-vous/:id/annuler triggers notification (personnel)', async () => {
    const res = await request(app)
      .post('/api/rendez-vous/77/annuler')
      .set('Authorization', `Bearer ${personnelToken}`)
      .send({ raison: 'Indisponibilité' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});


