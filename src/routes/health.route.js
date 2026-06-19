import { ERROR_MESSAGES } from '../constants/messages.js';

export default async function healthRoutes(fastify) {
  // PUBLIC HEALTH
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  // PRIVATE HEALTH
  fastify.get(
    '/health/details',
    {
      onRequest: async (request, reply) => {
        const apiKey = request.headers['x-api-key'];

        if (!apiKey || apiKey !== fastify.config.ADMIN_API_KEY) {
          throw fastify.httpErrors.unauthorized(ERROR_MESSAGES.INVALID_API_KEY);
        }
      },
    },
    async () => {
      return {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };
    },
  );
}
