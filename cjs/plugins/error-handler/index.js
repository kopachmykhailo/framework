const fp = require('fastify-plugin');

function errorHandlerPlugin(fastify, options, done) {
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    reply.status(error.statusCode || 500).send({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  });

  done();
}

module.exports = fp(errorHandlerPlugin);