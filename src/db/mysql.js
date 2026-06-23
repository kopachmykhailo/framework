import fp from 'fastify-plugin';
import mysql from 'mysql2/promise';

async function mysqlPlugin(fastify) {
  try {
    const pool = mysql.createPool({
      host: fastify.config.MYSQL_HOST,
      port: Number(fastify.config.MYSQL_PORT),
      user: fastify.config.MYSQL_USER,
      password: fastify.config.MYSQL_PASSWORD,
      database: fastify.config.MYSQL_DB,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    await pool.query('SELECT 1');

    fastify.decorate('db', pool);

    fastify.log.info('MySQL connected');
  } catch (error) {
    fastify.log.error(error, 'MySQL connection failed');
    process.exit(1);
  }

  fastify.addHook('onClose', async () => {
    await fastify.db.end();
    fastify.log.info('MySQL pool closed');
  });
}

export default fp(mysqlPlugin);
