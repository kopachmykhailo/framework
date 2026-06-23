import fp from 'fastify-plugin';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

import * as schema from './schema.js';

export default fp(async (fastify) => {
  const pool = await mysql.createPool({
    host: fastify.config.DB_HOST,
    port: Number(fastify.config.DB_PORT),
    user: fastify.config.DB_USER,
    password: fastify.config.DB_PASSWORD,
    database: fastify.config.DB_NAME,
  });

  const db = drizzle(pool, {
    schema,
    mode: 'default',
  });

  fastify.decorate('db', db);
});
