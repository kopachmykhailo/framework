import fs from 'fs/promises';
import path from 'path';

import { stringify } from 'csv/sync';

import {
  findAll,
  findById,
  create,
  update,
  remove,
} from '../items.repository.js';

export default async function (fastify) {
  fastify.get('/items', async () => {
    return await findAll();
  });

  fastify.get('/items/:id', async (request) => {
    return await findById(request.params.id);
  });

  fastify.post('/items', async (request) => {
    return await create(request.body);
  });

  fastify.put('/items/:id', async (request) => {
    return await update(request.params.id, request.body);
  });

  fastify.delete('/items/:id', async (request) => {
    await remove(request.params.id);

    return {
      success: true,
    };
  });

  fastify.get('/items/export', async (request, reply) => {
    const items = await findAll();

    const csv = stringify(items, {
      header: true,
    });

    reply.header('Content-Disposition', 'attachment; filename="items.csv"');

    reply.type('text/csv');

    return csv;
  });

  fastify.post('/items/import', async (request) => {
    const file = await request.file();

    const text = (await file.toBuffer()).toString();

    const items = JSON.parse(text);

    let imported = 0;

    for (const item of items) {
      await create(item);
      imported++;
    }

    return {
      imported,
    };
  });

  fastify.post('/items/:id/image', async (request) => {
    const data = await request.file();

    const folder = path.join(process.cwd(), 'uploads', request.params.id);

    await fs.mkdir(folder, {
      recursive: true,
    });

    const buffer = await data.toBuffer();

    await fs.writeFile(path.join(folder, 'image.jpg'), buffer);

    await update(request.params.id, {
      image: `/${request.params.id}/image.jpg`,
    });

    return {
      success: true,
    };
  });
}
