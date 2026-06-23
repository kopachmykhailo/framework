export const envSchema = {
  type: 'object',
  required: [
    'PORT',
    'HOSTNAME',
    'NODE_ENV',

    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',

    'REDIS_HOST',
    'REDIS_PORT',

    'SESSION_SECRET',
    'JWT_SECRET',
  ],
  properties: {
    PORT: { type: 'string' },
    HOSTNAME: { type: 'string' },
    NODE_ENV: { type: 'string' },

    DB_HOST: { type: 'string' },
    DB_PORT: { type: 'string' },
    DB_USER: { type: 'string' },
    DB_PASSWORD: { type: 'string' },
    DB_NAME: { type: 'string' },

    REDIS_HOST: { type: 'string' },
    REDIS_PORT: { type: 'string' },

    SESSION_SECRET: { type: 'string', minLength: 32 },
    JWT_SECRET: { type: 'string', minLength: 32 },
  },
};
