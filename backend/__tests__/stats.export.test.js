const request = require('supertest');

// Mock DB executeQuery and pdfkit
jest.mock('../src/config/database', () => ({
  executeQuery: jest.fn().mockResolvedValue([
    { id_centre: 1, centre_nom: 'Centre A', region_nom: 'Region X', nb_rdv: 10, nb_consultations: 7 }
  ])
}));

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    let out;
    return {
      pipe: jest.fn().mockImplementation((res) => {
        out = res;
      }),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      end: jest.fn().mockImplementation(() => {
        if (out && typeof out.end === 'function') {
          out.end(Buffer.from('%PDF-1.4')); // minimal bytes to close response
        }
      })
    };
  });
});

const app = require('../src/app');
const { signTestToken } = require('./helpers/auth');

describe('Statistiques export endpoints', () => {
  const adminToken = signTestToken({ id: 1, role: 'admin_centre', username: 'admin', id_centre: 1 });

  it('GET /api/statistiques/export should return CSV', async () => {
    const res = await request(app)
      .get('/api/statistiques/export?scope=centre')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('centre_nom');
  });

  it('GET /api/statistiques/export-pdf should return PDF', async () => {
    const res = await request(app)
      .get('/api/statistiques/export-pdf?scope=centre&periode=mois')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});


