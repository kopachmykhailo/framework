const { getUsers, getUserById } = require('../controllers/user.controller');
const { getStats } = require('../state/request-counter');

const getUserByIdSchema = {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'integer' }
      },
      required: ['id']
    }
  }
};

async function apiRoutes(fastify, options) {
  // ✅ правильно використовуємо функції
  fastify.get('/users', getUsers);
  fastify.get('/users/:id', getUserByIdSchema, getUserById);

  fastify.get('/stats', async () => getStats());
}

module.exports = {
  routes: apiRoutes
};