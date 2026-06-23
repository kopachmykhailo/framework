import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.js';

export function createAuthService({ db, jwt, redis, hashLib = argon2 }) {
  return {
    // REGISTER
    async register({ email, password }) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existing.length > 0) {
        throw new Error('User already exists');
      }

      const hash = await hashLib.hash(password);

      const result = await db.insert(users).values({
        email,
        password: hash,
      });

      // MySQL + drizzle -> НЕ returning()
      return {
        id: result[0]?.insertId,
        email,
      };
    },

    // LOGIN
    async login({ email, password }) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) return null;

      const ok = await hashLib.verify(user.password, password);
      if (!ok) return null;

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '15m' },
      );

      const refreshToken = jwt.sign({ userId: user.id }, { expiresIn: '7d' });

      await redis.set(
        `refresh:${user.id}`,
        refreshToken,
        'EX',
        60 * 60 * 24 * 7,
      );

      return { accessToken, refreshToken };
    },

    // REFRESH
    async refresh(refreshToken) {
      try {
        const payload = jwt.verify(refreshToken);

        const stored = await redis.get(`refresh:${payload.userId}`);
        if (stored !== refreshToken) return null;

        return jwt.sign({ userId: payload.userId }, { expiresIn: '15m' });
      } catch {
        return null;
      }
    },

    // LOGOUT
    async logout({ accessToken, refreshToken }) {
      const decoded = jwt.decode(accessToken);

      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);

        await redis.set(`bl:${accessToken}`, '1', 'EX', ttl);
      }

      const payload = jwt.decode(refreshToken);

      if (payload?.userId) {
        await redis.del(`refresh:${payload.userId}`);
      }
    },
  };
}
