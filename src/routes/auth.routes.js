import { createAuthService } from '../services/auth.service.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function (fastify) {
  const authService = createAuthService({
    db: fastify.db,
    jwt: fastify.jwt,
    redis: fastify.redis,
  });

  // REGISTER
  fastify.post('/auth/register', async (req, reply) => {
    const user = await authService.register(req.body);
    return reply.code(201).send(user);
  });

  // LOGIN
  fastify.post('/auth/login', async (req, reply) => {
    const { email, password } = req.body;

    const [user] = await fastify.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const result = await authService.login({ email, password });

    if (!result) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    return reply.code(200).send({
      accessToken: result.accessToken,
    });
  });

  // REFRESH
  fastify.post('/auth/refresh', async (req, reply) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return reply.code(401).send({ message: 'No refresh token' });
    }

    const accessToken = await authService.refresh(refreshToken);

    if (!accessToken) {
      return reply.code(401).send({ message: 'Invalid refresh' });
    }

    return reply.send({ accessToken });
  });

  // LOGOUT
  fastify.post('/auth/logout', async (req, reply) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send();
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const refreshToken = req.cookies?.refreshToken;

    await authService.logout({
      accessToken,
      refreshToken,
    });

    reply.clearCookie('refreshToken');

    return reply.code(204).send();
  });
}
