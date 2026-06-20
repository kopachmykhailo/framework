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

import { fetchGenres } from '../services/external.service.js';

export default async function (fastify) {
  // GET ALL ITEMS
  fastify.get('/items', async (request) => {
    const items = await findAll();

    // API V2 PAGINATION
    if (request.routerPath?.includes('/items')) {
      const url = request.raw.url;

      if (url.startsWith('/api/v2')) {
        const page = Number(request.query.page) || 1;
        const limit = Number(request.query.limit) || 10;

        const start = (page - 1) * limit;
        const end = start + limit;

        const data = items.slice(start, end);

        return {
          data,
          meta: {
            total: items.length,
            page,
            limit,
            totalPages: Math.ceil(items.length / limit),
          },
        };
      }
    }

    return items;
  });

  // DETAILS + FETCH + CACHE + RETRY
  fastify.get('/items/:id/details', async (request, reply) => {
    try {
      const item = await findById(request.params.id);

      const genres = await fetchGenres();

      if (!genres) {
        return {
          ...item,
          externalGenre: null,
        };
      }

      const genre = genres.find((g) => g.name === item.genre) || null;

      return {
        ...item,
        externalGenre: genre,
      };
    } catch {
      return reply.code(404).send({
        message: 'Book not found',
      });
    }
  });

  // GET BY ID
  fastify.get('/items/:id', async (request, reply) => {
    try {
      const item = await findById(request.params.id);

      return item;
    } catch {
      return reply.code(404).send({
        message: 'Book not found',
      });
    }
  });

  // CREATE
  fastify.post('/items', async (request, reply) => {
    const item = await create(request.body);

    return reply.code(201).send(item);
  });

  // UPDATE
  fastify.put('/items/:id', async (request, reply) => {
    try {
      const item = await update(request.params.id, request.body);

      return item;
    } catch {
      return reply.code(404).send({
        message: 'Book not found',
      });
    }
  });

  // DELETE
  fastify.delete('/items/:id', async (request, reply) => {
    try {
      await remove(request.params.id);

      return reply.code(200).send({
        success: true,
      });
    } catch {
      return reply.code(404).send({
        message: 'Book not found',
      });
    }
  });

  // EXPORT CSV
  fastify.get('/items/export', async (request, reply) => {
    const items = await findAll();

    const csv = stringify(items, {
      header: true,
    });

    reply.header('Content-Disposition', 'attachment; filename="items.csv"');

    reply.type('text/csv');

    return csv;
  });

  // IMPORT JSON
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

  // UPLOAD IMAGE
  fastify.post('/items/:id/image', async (request) => {
    const data = await request.file();

    const folder = path.join(process.cwd(), 'uploads', request.params.id);

    await fs.mkdir(folder, {
      recursive: true,
    });

    const buffer = await data.toBuffer();

    await fs.writeFile(path.join(folder, 'image.jpg'), buffer);

    await update(request.params.id, {
      image: `/uploads/${request.params.id}/image.jpg`,
    });

    return {
      success: true,
    };
  });
}
