import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService } from '../../src/services/auth.service.js';

describe('AuthService', () => {
  let mockDb;
  let mockJwt;
  let mockRedis;
  let mockHashLib;
  let service;

  beforeEach(() => {
    mockHashLib = {
      hash: vi.fn(),
      verify: vi.fn(),
    };

    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn(),
    };

    mockJwt = {
      sign: vi.fn((payload, opts) => `token_${JSON.stringify(payload)}`),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      setex: vi.fn().mockResolvedValue('OK'),
    };

    service = createAuthService({
      db: mockDb,
      jwt: mockJwt,
      redis: mockRedis,
      hashLib: mockHashLib,
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockHashLib.hash.mockResolvedValueOnce('hashed_password');
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.values.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
      });
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      mockDb.where.mockResolvedValueOnce([{ id: 1, email: 'test@example.com' }]);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('User already exists');
    });

    it('should hash password before storing', async () => {
      mockHashLib.hash.mockResolvedValueOnce('hashed_password');
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.values.mockResolvedValueOnce([{ insertId: 1 }]);

      await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockHashLib.hash).toHaveBeenCalledWith('password123');
    });
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const user = { id: 1, email: 'test@example.com', password: 'hashed' };
      mockDb.where.mockResolvedValueOnce([user]);
      mockHashLib.verify.mockResolvedValueOnce(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await service.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const user = { id: 1, email: 'test@example.com', password: 'hashed' };
      mockDb.where.mockResolvedValueOnce([user]);
      mockHashLib.verify.mockResolvedValueOnce(false);

      const result = await service.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toBeNull();
    });

    it('should verify password with argon2', async () => {
      const user = { id: 1, email: 'test@example.com', password: 'hashed' };
      mockDb.where.mockResolvedValueOnce([user]);
      mockHashLib.verify.mockResolvedValueOnce(true);

      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockHashLib.verify).toHaveBeenCalledWith('hashed', 'password123');
    });
  });

  describe('refresh', () => {
    it('should return new access token with valid refresh token', async () => {
      mockJwt.verify.mockReturnValueOnce({ userId: 1 });
      mockRedis.get.mockResolvedValueOnce('valid_refresh_token');
      mockJwt.sign.mockReturnValueOnce('new_access_token');

      const result = await service.refresh('valid_refresh_token');

      expect(result).toBe('new_access_token');
      expect(mockJwt.verify).toHaveBeenCalledWith('valid_refresh_token');
    });

    it('should return null if refresh token is invalid', async () => {
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const result = await service.refresh('invalid_token');

      expect(result).toBeNull();
    });

    it('should return null if stored token does not match', async () => {
      mockJwt.verify.mockReturnValueOnce({ userId: 1 });
      mockRedis.get.mockResolvedValueOnce('different_token');

      const result = await service.refresh('refresh_token');

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should add token to blacklist and delete refresh token', async () => {
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';
      const currentTime = Math.floor(Date.now() / 1000);

      mockJwt.decode.mockReturnValueOnce({ exp: currentTime + 3600, userId: 1 });
      mockJwt.decode.mockReturnValueOnce({ userId: 1 });

      await service.logout({ accessToken, refreshToken });

      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith('refresh:1');
    });

    it('should handle missing expiration in token', async () => {
      mockJwt.decode.mockReturnValueOnce({});
      mockJwt.decode.mockReturnValueOnce({});

      await expect(
        service.logout({
          accessToken: 'token',
          refreshToken: 'token',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
