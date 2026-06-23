import { beforeAll, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../src/app.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_which_is_long_enough_123456';

let app;

beforeAll(() => {
});

beforeEach(async () => {
  app = await buildApp({ skipBackup: true });
  await app.ready();
  global.app = app;
});

afterEach(async () => {
  if (app) await app.close();
});