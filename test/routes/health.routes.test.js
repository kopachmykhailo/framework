import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';

describe('Health Routes Integration', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 status code', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return health check object', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      const body = response.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
    });

    it('should have status value of ok or similar', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      const body = response.json();
      expect(body.status).toMatch(/ok|healthy|live/i);
    });
  });
});
