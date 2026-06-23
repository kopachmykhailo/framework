import fastifyRedis from '@fastify/redis';

export default async function redisPlugin(fastify) {
  fastify.register(fastifyRedis, {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  });
}
