import Fastify from 'fastify';

import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyRateLimit from '@fastify/rate-limit';

import path from 'path';

import { envSchema } from './schemas/env.schema.js';

import healthRoutes from './routes/health.route.js';
import itemsRoutes from './routes/items.route.js';
import githubRoutes from './routes/github.route.js';

import { createBackup } from './backup.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
            }
          : undefined,
    },
  });

  // ENV
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  // BACKUP
  await createBackup();

  // RATE LIMIT
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // SWAGGER
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Books API',
        description: 'Lab 6 REST API',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
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

  // MULTIPART
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  // STATIC FILES
  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

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

  // API V1
  await fastify.register(healthRoutes, {
    prefix: '/api/v1',
  });

  await fastify.register(itemsRoutes, {
    prefix: '/api/v1',
  });

  // API V2
  await fastify.register(itemsRoutes, {
    prefix: '/api/v2',
  });

  // GITHUB
  await fastify.register(githubRoutes, {
    prefix: '/api/v1/github',
  });

  await fastify.register(githubRoutes, {
    prefix: '/api/v2/github',
  });

  return fastify;
}
