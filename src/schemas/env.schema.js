export const envSchema = {
  type: 'object',
  required: ['PORT', 'HOSTNAME', 'NODE_ENV', 'ADMIN_API_KEY'],
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
  },
};
