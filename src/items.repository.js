import fs from 'fs/promises';
import path from 'path';

import itemModel from './models/item.model.js';
import { writeAtomic } from './writeAtomic.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'items');

const getFilePath = (id) => path.join(DATA_DIR, `${id}.json`);

export const findAll = async () => {
  const files = await fs.readdir(DATA_DIR);

  const items = [];

  for (const file of files) {
    const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');

    items.push(JSON.parse(content));
  }

  return items;
};

export const findById = async (id) => {
  const content = await fs.readFile(getFilePath(id), 'utf8');

  return JSON.parse(content);
};

export const create = async (data) => {
  const id = Date.now().toString();

  const item = {
    ...itemModel,
    ...data,
    id,
  };

  await writeAtomic(getFilePath(id), item);

  return item;
};

export const update = async (id, body) => {
  const current = await findById(id);

  const updated = {
    ...current,
    ...body,
  };

  await writeAtomic(getFilePath(id), updated);

  return updated;
};

export const remove = async (id) => {
  await fs.unlink(getFilePath(id));
};
