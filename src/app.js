import Fastify from 'fastify';

import fastifyEnv from '@fastify/env';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySensible from '@fastify/sensible';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyRateLimit from '@fastify/rate-limit';

import path from 'path';

import { envSchema } from './schemas/env.schema.js';

import healthRoutes from './routes/health.route.js';
import itemsRoutes from './routes/items.route.js';
import githubRoutes from './routes/github.route.js';
import wsRoutes from './routes/ws.route.js';
import backupRoutes from './routes/backup.routes.js';

import { createBackup } from './backup.js';
import mysqlPlugin from './db/mysql.js';
import { runMigration } from './db/run-migration.js';

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

  // ENV CONFIG
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: {
      path: '.env',
    },
  });

  await fastify.after();

  // MySQL plugin
  await fastify.register(mysqlPlugin);

  // Run migration check
  await runMigration(fastify);

  // WebSocket
  await fastify.register(fastifyWebsocket);

  // Backup on startup
  await createBackup(fastify);

  // Rate limit
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Swagger
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Books API',
        description: 'Lab 8 REST API (MySQL)',
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
      process.env.NODE_ENV === 'production' ? 'https://example.com' : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Security
  await fastify.register(fastifyHelmet, {
    global: true,
  });

  await fastify.register(fastifySensible);

  // Multipart
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  // Static files
  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    reply.status(error.statusCode || 500).send({
      success: false,
      error: error.name,
      message: error.message,
    });
  });

  // Routes
  await fastify.register(healthRoutes, { prefix: '/api/v1' });
  await fastify.register(itemsRoutes, { prefix: '/api/v1' });

  await fastify.register(githubRoutes, { prefix: '/api/v1/github' });
  await fastify.register(githubRoutes, { prefix: '/api/v2/github' });

  await fastify.register(wsRoutes);

  await fastify.register(backupRoutes, {
    prefix: '/api/v1',
  });

  return fastify;
}
