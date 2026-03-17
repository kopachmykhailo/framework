const fastify = require('fastify');
const { routes } = require('./routes/api.routes'); // 👈 ВАЖЛИВО!
const errorHandler = require('./plugins/error-handler');

function buildApp() {
  const app = fastify({ logger: true });

  app.register(errorHandler);

  app.get('/health', async () => ({ status: 'ok' }));

  app.register(routes, { prefix: '/api' });

  return app;
}

module.exports = buildApp;