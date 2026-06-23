import fp from 'fastify-plugin';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

export default fp(async (fastify) => {
  const connection = await mysql.createPool({
    host: fastify.config.DB_HOST,
    port: fastify.config.DB_PORT,
    user: fastify.config.DB_USER,
    password: fastify.config.DB_PASSWORD,
    database: fastify.config.DB_NAME,
  });

  const db = drizzle(connection);

  fastify.decorate('db', db);
});
