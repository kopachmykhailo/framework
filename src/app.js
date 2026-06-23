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

import path from 'path';

import { envSchema } from './schemas/env.schema.js';

// routes
import healthRoutes from './routes/health.route.js';
import itemsRoutes from './routes/items.route.js';
import githubRoutes from './routes/github.route.js';
import wsRoutes from './routes/ws.route.js';
import backupRoutes from './routes/backup.routes.js';
import authRoutes from './routes/auth.routes.js';

import { createBackup } from './backup.js';

// plugins
import dbPlugin from './db/index.js';
import redisPlugin from './plugins/redis.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import sessionPlugin from './plugins/session.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
    },
  });

  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: { path: '.env' },
  });

  await fastify.after();

  // DB
  await fastify.register(dbPlugin);

  // Redis
  await fastify.register(redisPlugin);

  // Session
  await fastify.register(sessionPlugin);

  // Rate limit
  await fastify.register(rateLimitPlugin);

  await fastify.register(fastifyWebsocket);

  await createBackup(fastify);

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Books API',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  await fastify.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  await fastify.register(fastifyHelmet, { global: true });
  await fastify.register(fastifySensible);

  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);

    reply.status(error.statusCode || 500).send({
      success: false,
      error: error.name,
      message: error.message,
    });
  });

  // ROUTES
  await fastify.register(healthRoutes, { prefix: '/api/v1' });
  await fastify.register(itemsRoutes, { prefix: '/api/v2' });

  await fastify.register(authRoutes, { prefix: '/api/v1' });

  await fastify.register(githubRoutes, { prefix: '/api/v1/github' });
  await fastify.register(githubRoutes, { prefix: '/api/v2/github' });

  await fastify.register(wsRoutes);

  await fastify.register(backupRoutes, {
    prefix: '/api/v1',
  });

  return fastify;
}
