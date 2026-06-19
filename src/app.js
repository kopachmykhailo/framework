import Fastify from 'fastify';

import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';

import { envSchema } from './schemas/env.schema.js';
import healthRoutes from './routes/health.route.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty' }
          : undefined,
    },
  });

  // ENV
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  // CORS
  await fastify.register(fastifyCors, {
    origin:
      fastify.config.NODE_ENV === 'production' ? 'https://example.com' : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // HELMET
  await fastify.register(fastifyHelmet, {
    global: true,
  });

  // SENSIBLE
  await fastify.register(fastifySensible);

  // ERROR HANDLER
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({
      err: error,
      method: request.method,
      url: request.url,
    });

    reply.status(error.statusCode || 500).send({
      success: false,
      statusCode: error.statusCode || 500,
      error: error.name,
      message: error.message,
    });
  });

  // ROUTES
  await fastify.register(healthRoutes);

  return fastify;
}
