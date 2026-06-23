import { createAuthService } from '../services/auth.service.js';

export default async function (fastify) {
  const authService = createAuthService({
    db: fastify.db,
    jwt: fastify.jwt,
    redis: fastify.redis,
  });

  // REGISTER
  fastify.post(
    '/auth/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const user = await authService.register(req.body);
        return reply.code(201).send(user);
      } catch (error) {
        if (error.message === 'User already exists') {
          return reply.code(400).send({ message: error.message });
        }
        throw error;
      }
    },
  );

  // LOGIN (JWT)
  fastify.post(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (req, reply) => {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      if (!result) {
        return reply.code(401).send({ message: 'Invalid credentials' });
      }

      return { token: result.accessToken };
    },
  );

  // ME (optional route for tests)
  fastify.get(
    '/auth/me',
    {
      preHandler: [fastify.authenticate],
    },
    async (req) => {
      return { user: req.user };
    },
  );
}
