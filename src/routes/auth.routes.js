import { createAuthService } from '../services/auth.service.js';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.js';

export default async function (fastify) {
  const authService = createAuthService({ db: fastify.db });

  // REGISTER
  fastify.post('/auth/register', async (request, reply) => {
    const user = await authService.register(request.body);

    return reply.code(201).send(user);
  });

  // LOGIN
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    const usersFound = await fastify.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    const user = usersFound[0];

    if (!user) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const result = await authService.login({ user, password });

    if (!result) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    request.session.user = {
      id: result.id,
      email: result.email,
    };

    return { success: true };
  });

  // LOGOUT
  fastify.post('/auth/logout', async (request, reply) => {
    await request.session.destroy();
    return reply.code(204).send();
  });
}
