import fs from 'fs/promises';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'cache', 'reference.json');

const TTL = 120000;

export const getCache = async () => {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');

    const cache = JSON.parse(raw);

    if (Date.now() - cache.timestamp < TTL) {
      return cache.data;
    }

    return null;
  } catch {
    return null;
  }
};

export const setCache = async (data) => {
  await fs.mkdir(path.dirname(CACHE_FILE), {
    recursive: true,
  });

  await fs.writeFile(
    CACHE_FILE,
    JSON.stringify({
      timestamp: Date.now(),
      data,
    }),
  );
};
