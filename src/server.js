import { buildApp } from './app.js';

const start = async () => {
  const fastify = await buildApp();

  await fastify.listen({
    port: fastify.config.PORT,
    host: fastify.config.HOSTNAME,
  });

  const gracefulShutdown = async (signal) => {
    fastify.log.info(`Received ${signal}`);

    const timeout = setTimeout(() => process.exit(1), 10000);

    await fastify.close();

    clearTimeout(timeout);
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  process.on('uncaughtException', (err) => {
    fastify.log.error(err);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (err) => {
    fastify.log.error(err);
    gracefulShutdown('unhandledRejection');
  });
};

start();
