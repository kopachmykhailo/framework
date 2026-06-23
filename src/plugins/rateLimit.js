import rateLimit from '@fastify/rate-limit';

export default async function rateLimitPlugin(fastify) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: fastify.redis,
  });
}
