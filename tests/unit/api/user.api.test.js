import request from 'supertest';
import app from '../../src/app.js';

describe('User API', () => {
  it('GET /users should return 200', async () => {
    const res = await request(app).get('/users');

    expect(res.statusCode).toBe(200);
  });
});
