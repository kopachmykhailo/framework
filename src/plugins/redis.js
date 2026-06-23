import fp from 'fastify-plugin';
import redis from '@fastify/redis';

function createInMemoryRedis() {
  const store = new Map();
  const expirations = new Map();
  const commands = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, expireAt] of expirations.entries()) {
      if (expireAt <= now) {
        expirations.delete(key);
        store.delete(key);
      }
    }
  };

  const setValue = (key, value, ttl) => {
    store.set(key, value);
    if (ttl) {
      expirations.set(key, Date.now() + ttl * 1000);
    } else {
      expirations.delete(key);
    }
  };

  return {
    defineCommand(name, opts) {
      commands.set(name, opts);
    },

    async get(key) {
      cleanup();
      const value = store.get(key);
      return value === undefined ? null : value;
    },

    async set(key, value) {
      cleanup();
      setValue(key, value);
      return 'OK';
    },

    async setex(key, seconds, value) {
      cleanup();
      setValue(key, value, Number(seconds));
      return 'OK';
    },

    async del(key) {
      cleanup();

      if (Array.isArray(key)) {
        let deleted = 0;
        for (const item of key) {
          if (store.delete(item)) {
            expirations.delete(item);
            deleted += 1;
          }
        }
        return deleted;
      }

      const existed = store.delete(key);
      expirations.delete(key);
      return existed ? 1 : 0;
    },

    async keys(pattern) {
      cleanup();
      const regexp = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return Array.from(store.keys()).filter((key) => regexp.test(key));
    },

    rateLimit(key, timeWindow, max, continueExceeding, exponentialBackoff, callback) {
      cleanup();
      const current = Number(store.get(key) ?? 0) + 1;
      const now = Date.now();
      let ttl = expirations.has(key) ? Math.max(0, Math.ceil((expirations.get(key) - now) / 1000)) : 0;

      store.set(key, String(current));
      if (current === 1 || (continueExceeding === 'true' && current > max)) {
        ttl = Number(timeWindow);
        expirations.set(key, now + ttl);
      } else if (exponentialBackoff === 'true' && current > max) {
        const backoffExponent = current - max - 1;
        ttl = Math.min(Number(timeWindow) * 2 ** backoffExponent, Number.MAX_SAFE_INTEGER);
        expirations.set(key, now + ttl);
      }

      callback(null, [current, ttl]);
    },
  };
}

export default fp(async (fastify) => {
  if (process.env.NODE_ENV === 'test') {
    fastify.decorate('redis', createInMemoryRedis());
    return;
  }

  fastify.register(redis, {
    host: fastify.config.REDIS_HOST,
    port: fastify.config.REDIS_PORT,
  });
});
