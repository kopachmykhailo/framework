import fp from 'fastify-plugin';
import mongoose from 'mongoose';

async function mongoPlugin(fastify) {
  try {
    const mongoUrl = `${fastify.config.MONGO_URL}/${fastify.config.MONGO_DB_NAME}`;

    await mongoose.connect(mongoUrl);

    fastify.decorate('db', mongoose.connection);

    fastify.log.info('MongoDB connected');
  } catch (error) {
    fastify.log.error(error, 'MongoDB connection failed');
    process.exit(1);
  }

  fastify.addHook('onClose', async () => {
    await mongoose.connection.close();
    fastify.log.info('MongoDB connection closed');
  });
}

export default fp(mongoPlugin);
