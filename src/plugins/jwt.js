import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (fastify) => {
  fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,
  });

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();

      const token = request.headers.authorization?.replace('Bearer ', '');

      const blacklisted = await fastify.redis.get(`blacklist:${token}`);

      if (blacklisted) {
        return reply.code(401).send({ message: 'Token revoked' });
      }
    } catch (err) {
      return reply.code(401).send(err);
    }
  });
});
