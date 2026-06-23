import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';
import { createGzip } from 'zlib';

import { createItemsRepository } from './items.repository.js';

const BACKUPS_DIR = path.join(process.cwd(), 'data', 'backups');

export async function createBackup(fastify) {
  await fsPromises.mkdir(BACKUPS_DIR, {
    recursive: true,
  });

  const timestamp = Date.now().toString();
  const backupFile = path.join(BACKUPS_DIR, `${timestamp}.gz`);

  const itemsRepository = createItemsRepository(fastify.db);
  const items = await itemsRepository.findAll();

  const source = new PassThrough();
  const gzip = createGzip();
  const destination = fs.createWriteStream(backupFile);

  const pipelinePromise = pipeline(source, gzip, destination);

  for (const item of items) {
    source.write(JSON.stringify(item) + '\n');
  }

  source.end();

  await pipelinePromise;

  const backups = await fsPromises.readdir(BACKUPS_DIR);
  const gzipBackups = backups.filter((file) => file.endsWith('.gz')).sort();

  if (gzipBackups.length > 5) {
    const oldBackups = gzipBackups.slice(0, gzipBackups.length - 5);

    for (const backup of oldBackups) {
      await fsPromises.unlink(path.join(BACKUPS_DIR, backup));
    }
  }

  return timestamp;
}
