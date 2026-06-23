import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemsService } from '../../src/services/items.service.js';

describe('ItemsService', () => {
  let mockDb;
  let mockRedis;
  let service;

  beforeEach(() => {
    mockDb = {
      query: {
        items: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
      schema: {
        items: {},
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([{ id: 1 }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1 }]),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };

    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
      keys: vi.fn().mockResolvedValue([]),
      del: vi.fn().mockResolvedValue(0),
    };

    service = new ItemsService({
      db: mockDb,
      redis: mockRedis,
    });
  });

  describe('getItems', () => {
    it('should return items from database when cache is empty', async () => {
      const items = [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' },
      ];
      mockDb.query.items.findMany.mockResolvedValueOnce(items);

      const result = await service.getItems(1, 10);

      expect(result).toEqual(items);
      expect(mockDb.query.items.findMany).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
      });
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should return cached items when available', async () => {
      const cachedItems = [{ id: 1, title: 'Cached Item' }];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedItems));

      const result = await service.getItems(1, 10);

      expect(result).toEqual(cachedItems);
      expect(mockDb.query.items.findMany).not.toHaveBeenCalled();
    });

    it('should calculate correct offset for pagination', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockDb.query.items.findMany.mockResolvedValueOnce([]);

      await service.getItems(3, 20);

      expect(mockDb.query.items.findMany).toHaveBeenCalledWith({
        limit: 20,
        offset: 40,
      });
    });

    it('should cache results for 24 hours', async () => {
      mockDb.query.items.findMany.mockResolvedValueOnce([]);

      await service.getItems(1, 10);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.any(String),
        86400,
        expect.any(String),
      );
    });
  });

  describe('invalidateCache', () => {
    it('should delete all cache keys starting with items:', async () => {
      const keys = ['items:1:10', 'items:2:10', 'items:1:20'];
      mockRedis.keys.mockResolvedValueOnce(keys);

      await service.invalidateCache();

      expect(mockRedis.keys).toHaveBeenCalledWith('items:*');
      expect(mockRedis.del).toHaveBeenCalledWith(keys);
    });

    it('should not call del if no cache keys exist', async () => {
      mockRedis.keys.mockResolvedValueOnce([]);

      await service.invalidateCache();

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('createItem', () => {
    it('should create item and invalidate cache', async () => {
      const itemData = { title: 'New Item' };
      mockRedis.keys.mockResolvedValueOnce([]);

      const result = await service.createItem(itemData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockRedis.keys).toHaveBeenCalledWith('items:*');
    });

    it('should return result from database', async () => {
      const itemData = { title: 'New Item' };
      const dbResult = [{ id: 1 }];
      mockDb.insert.mockReturnValueOnce({
        values: vi.fn().mockResolvedValueOnce(dbResult),
      });
      mockRedis.keys.mockResolvedValueOnce([]);

      const result = await service.createItem(itemData);

      expect(result).toEqual(dbResult);
    });
  });

  describe('updateItem', () => {
    it('should update item and invalidate cache', async () => {
      const updateData = { title: 'Updated Item' };
      mockRedis.keys.mockResolvedValueOnce([]);

      await service.updateItem(1, updateData);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockRedis.keys).toHaveBeenCalledWith('items:*');
    });
  });

  describe('deleteItem', () => {
    it('should delete item and invalidate cache', async () => {
      mockRedis.keys.mockResolvedValueOnce([]);

      await service.deleteItem(1);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockRedis.keys).toHaveBeenCalledWith('items:*');
    });
  });
});
