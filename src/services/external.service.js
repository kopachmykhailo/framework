import { getCache, setCache } from './cache.service.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchGenres = async () => {
  const cached = await getCache();

  if (cached) {
    return cached;
  }

  const delays = [1000, 2000, 4000];

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();

      const timer = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3001/genres', {
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      await setCache(data);

      return data;
    } catch (error) {
      if (attempt === 2) {
        return null;
      }

      await sleep(delays[attempt]);
    }
  }
};
