export const REDIS_KEYS = {
  ITEMS: (page, limit) => `items:${page}:${limit}`,
};
