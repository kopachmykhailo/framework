import fs from 'fs/promises';
import path from 'path';
import { stringify } from 'csv/sync';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

import { createItemsRepository } from '../items.repository.js';
import { fetchGenres } from '../services/external.service.js';

import { BooksTransform } from '../transforms/BooksTransform.js';
import { NdjsonTransform } from '../transforms/NdjsonTransform.js';
import { eventBus } from '../events/eventBus.js';

// AUTH GUARD (SESSION)
function authGuard(request, reply, done) {
  if (!request.session?.user) {
    return reply.code(401).send({
      message: 'Unauthorized',
    });
  }
  done();
}

export default async function (fastify) {
  const itemsRepository = createItemsRepository(fastify.db);

  // GET ALL ITEMS
  fastify.get('/items', async (request) => {
    const items = await itemsRepository.findAll();

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

  // DETAILS
  fastify.get('/items/:id/details', async (request, reply) => {
    const item = await itemsRepository.findById(request.params.id);

    if (!item) {
      return reply.code(404).send({ message: 'Book not found' });
    }

    const genres = await fetchGenres();

    const genre = genres?.find((g) => g.name === item.genre) || null;

    return {
      ...item,
      externalGenre: genre,
    };
  });

  // GET BY ID
  fastify.get('/items/:id', async (request, reply) => {
    const item = await itemsRepository.findById(request.params.id);

    if (!item) {
      return reply.code(404).send({ message: 'Book not found' });
    }

    return item;
  });

  // CREATE (PROTECTED)
  fastify.post('/items', { preHandler: authGuard }, async (request, reply) => {
    const item = await itemsRepository.create(request.body);

    eventBus.emit('created', item);

    return reply.code(201).send(item);
  });

  // UPDATE (PROTECTED)
  fastify.put(
    '/items/:id',
    { preHandler: authGuard },
    async (request, reply) => {
      const item = await itemsRepository.update(
        request.params.id,
        request.body,
      );

      if (!item) {
        return reply.code(404).send({ message: 'Book not found' });
      }

      eventBus.emit('updated', item);

      return item;
    },
  );

  // DELETE (PROTECTED)
  fastify.delete(
    '/items/:id',
    { preHandler: authGuard },
    async (request, reply) => {
      const removed = await itemsRepository.remove(request.params.id);

      if (!removed) {
        return reply.code(404).send({ message: 'Book not found' });
      }

      eventBus.emit('deleted', request.params.id);

      return reply.code(200).send({ success: true });
    },
  );

  // EXPORT CSV
  fastify.get('/items/export', async (request, reply) => {
    const items = await itemsRepository.findAll();

    const transformEnabled = request.query.transform === 'true';

    let result = items;

    if (transformEnabled) {
      const transformedItems = [];

      const source = Readable.from(items);

      const collector = new Transform({
        objectMode: true,
        transform(chunk, enc, callback) {
          transformedItems.push(chunk);
          callback();
        },
      });

      await pipeline(source, new BooksTransform(), collector);

      result = transformedItems;
    }

    const csv = stringify(result, { header: true });

    reply.header('Content-Disposition', 'attachment; filename="items.csv"');
    reply.type('text/csv');

    return csv;
  });

  // STREAM NDJSON
  fastify.get('/items/stream', async (request, reply) => {
    const items = await itemsRepository.findAll();

    reply.type('application/x-ndjson');

    const stream = Readable.from(items).pipe(new NdjsonTransform());

    return reply.send(stream);
  });

  // IMPORT JSON
  fastify.post('/items/import', async (request) => {
    const file = await request.file();

    const text = (await file.toBuffer()).toString();
    const items = JSON.parse(text);

    let imported = 0;

    for (const item of items) {
      await itemsRepository.create(item);
      imported++;
    }

    return { imported };
  });

  // UPLOAD IMAGE
  fastify.post('/items/:id/image', async (request, reply) => {
    const existingItem = await itemsRepository.findById(request.params.id);

    if (!existingItem) {
      return reply.code(404).send({ message: 'Book not found' });
    }

    const data = await request.file();

    const folder = path.join(
      process.cwd(),
      'uploads',
      String(request.params.id),
    );

    await fs.mkdir(folder, { recursive: true });

    const buffer = await data.toBuffer();

    await fs.writeFile(path.join(folder, 'image.jpg'), buffer);

    await itemsRepository.update(request.params.id, {
      image: `/uploads/${request.params.id}/image.jpg`,
    });

    return { success: true };
  });
}
