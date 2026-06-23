import fp from 'fastify-plugin';
import session from '@fastify/session';
import cookie from '@fastify/cookie';
import RedisStore from 'fastify-session-redis-store';

export default fp(async (fastify) => {
  await fastify.register(cookie);

  if (!fastify.redis) {
    throw new Error('Redis is not registered before session plugin');
  }

  await fastify.register(session, {
    secret: fastify.config.SESSION_SECRET,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
    store: new RedisStore({
      client: fastify.redis,
    }),
    saveUninitialized: false,
  });
});
