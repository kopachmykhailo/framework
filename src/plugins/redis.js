import fp from 'fastify-plugin';
import redis from '@fastify/redis';

export default fp(async (fastify) => {
  await fastify.register(redis, {
    host: fastify.config.REDIS_HOST,
    port: fastify.config.REDIS_PORT,
  });
});
