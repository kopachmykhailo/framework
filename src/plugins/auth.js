import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (fastify) => {
  fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,
  });

  // перевірка blacklist
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return reply.code(401).send({ message: 'Missing token' });
      }

      const isBlacklisted = await fastify.redis.get(`bl:${token}`);
      if (isBlacklisted) {
        return reply.code(401).send({ message: 'Token blacklisted' });
      }

      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });
});
