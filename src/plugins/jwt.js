import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (fastify) => {
  fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,
  });

  fastify.decorate('authenticate', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });
});
