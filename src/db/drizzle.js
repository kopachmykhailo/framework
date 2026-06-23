import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.js';

export default fp(async function drizzlePlugin(fastify) {
  const db = drizzle(fastify.mysql, {
    schema,
    mode: 'default',
  });

  fastify.decorate('db', db);
});
