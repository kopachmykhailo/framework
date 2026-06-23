import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'mysql',

  dbCredentials: {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: undefined,
    database: 'lab8_books',
  },
});
