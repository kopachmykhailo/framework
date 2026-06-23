import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';

describe('Auth Routes Integration', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    // Clean up users table before each test
    try {
      await app.db.delete(app.db.schema.users);
    } catch (err) {
      // Table might not exist yet, that's ok
    }
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'newuser@example.com',
          password: 'securepassword123',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body).toHaveProperty('email', 'newuser@example.com');
      expect(body).toHaveProperty('id');
    });

    it('should not register user with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'securepassword123',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should not register user with short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'user@example.com',
          password: '123',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should not register duplicate user', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'duplicate@example.com',
          password: 'securepassword123',
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'duplicate@example.com',
          password: 'securepassword123',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'securepassword123',
        },
      });
    });

    it('should login user with correct credentials and return token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'securepassword123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('token');
      authToken = body.token;
    });

    it('should return 401 for non-existent user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/v1/auth/me (Protected)', () => {
    beforeEach(async () => {
      const register = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'authtest@example.com',
          password: 'securepassword123',
        },
      });

      const login = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'authtest@example.com',
          password: 'securepassword123',
        },
      });

      authToken = login.json().token;
    });

    it('should return user info with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('user');
    });

    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer invalid_token_12345',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
