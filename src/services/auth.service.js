import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.js';

export function createAuthService({ db }) {
  return {
    async register({ email, password }) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existing.length > 0) {
        throw new Error('User already exists');
      }

      const hashedPassword = await argon2.hash(password);

      const result = await db.insert(users).values({
        email,
        password: hashedPassword,
      });

      return {
        id: result[0]?.insertId ?? null,
        email,
      };
    },

    async login({ user, password }) {
      const valid = await argon2.verify(user.password, password);

      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
      };
    },
  };
}
