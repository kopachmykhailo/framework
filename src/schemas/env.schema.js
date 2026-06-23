export const envSchema = {
  type: 'object',
  required: [
    'PORT',
    'HOSTNAME',
    'NODE_ENV',
    'ADMIN_API_KEY',
    'MYSQL_HOST',
    'MYSQL_PORT',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DB',
  ],
  properties: {
    PORT: {
      type: 'number',
      default: 3000,
    },
    HOSTNAME: {
      type: 'string',
      default: 'localhost',
    },
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
    ADMIN_API_KEY: {
      type: 'string',
    },
    MYSQL_HOST: {
      type: 'string',
    },
    MYSQL_PORT: {
      type: 'number',
    },
    MYSQL_USER: {
      type: 'string',
    },
    MYSQL_PASSWORD: {
      type: 'string',
    },
    MYSQL_DB: {
      type: 'string',
    },
  },
};
