import { REDIS_KEYS } from '../constants/redisKeys.js';

export class ReferenceService {
  constructor({ redis }) {
    this.redis = redis;
  }

  async getReference() {
    const cached = await this.redis.get(REDIS_KEYS.REFERENCE);

    if (cached) {
      return JSON.parse(cached);
    }

    const data = { hello: 'world' }; // або твій файл/логіка

    await this.redis.set(REDIS_KEYS.REFERENCE, JSON.stringify(data), 'EX', 120);

    return data;
  }
}
