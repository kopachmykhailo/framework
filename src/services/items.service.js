import { REDIS_KEYS } from '../constants/redisKeys.js';

export class ItemsService {
  constructor({ db, redis }) {
    this.db = db;
    this.redis = redis;
  }

  async getItems(page, limit) {
    const key = REDIS_KEYS.ITEMS(page, limit);

    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const items = await this.db.query.items.findMany({
      limit,
      offset: (page - 1) * limit,
    });

    await this.redis.setex(key, 86400, JSON.stringify(items));

    return items;
  }

  async invalidateCache() {
    const keys = await this.redis.keys('items:*');

    if (keys.length) {
      await this.redis.del(keys);
    }
  }

  async createItem(data) {
    const result = await this.db.insert(this.db.schema.items).values(data);

    await this.invalidateCache();

    return result;
  }

  async updateItem(id, data) {
    const result = await this.db
      .update(this.db.schema.items)
      .set(data)
      .where(this.db.eq(this.db.schema.items.id, id));

    await this.invalidateCache();

    return result;
  }

  async deleteItem(id) {
    const result = await this.db
      .delete(this.db.schema.items)
      .where(this.db.eq(this.db.schema.items.id, id));

    await this.invalidateCache();

    return result;
  }
}
