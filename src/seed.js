import { items } from './db/schema.js';

export async function seed(fastify) {
  await fastify.db.insert(items).values([
    {
      name: 'Item 1',
      description: 'Seed data 1',
    },
    {
      name: 'Item 2',
      description: 'Seed data 2',
    },
  ]);
}
