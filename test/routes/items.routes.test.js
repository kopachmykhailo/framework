import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';

describe('Items Routes Integration', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    // Clean up items table before each test
    try {
      await app.db.delete(app.db.schema.items);
    } catch (err) {
      // Table might not exist yet, that's ok
    }
  });

  describe('GET /api/v2/items', () => {
    it('should return empty list initially', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/items?page=1&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.data).toEqual([]);
    });

    it('should return paginated items with metadata', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/items?page=1&limit=10',
      });

      const body = response.json();
      expect(body.meta).toHaveProperty('total');
      expect(body.meta).toHaveProperty('page', 1);
      expect(body.meta).toHaveProperty('limit', 10);
      expect(body.meta).toHaveProperty('totalPages');
    });

    it('should handle pagination with different page numbers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/items?page=2&limit=5',
      });

      const body = response.json();
      expect(body.meta.page).toBe(2);
      expect(body.meta.limit).toBe(5);
    });
  });

  describe('POST /api/v2/items', () => {
    it('should create a new item and return 201', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v2/items',
        payload: {
          title: 'Test Book',
          author: 'Test Author',
          genre: 'Fiction',
          year: 2024,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('title', 'Test Book');
    });

    it('should return created item with all properties', async () => {
      const itemData = {
        title: 'Another Book',
        author: 'Another Author',
        genre: 'Science',
        year: 2023,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v2/items',
        payload: itemData,
      });

      const body = response.json();
      expect(body.title).toBe(itemData.title);
      expect(body.author).toBe(itemData.author);
      expect(body.genre).toBe(itemData.genre);
      expect(body.year).toBe(itemData.year);
    });
  });

  describe('GET /api/v2/items/:id', () => {
    let itemId;

    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v2/items',
        payload: {
          title: 'Test Item',
          author: 'Test Author',
          genre: 'Fiction',
          year: 2024,
        },
      });

      itemId = response.json().id;
    });

    it('should return 200 and item details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v2/items/${itemId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('id', itemId);
      expect(body).toHaveProperty('title', 'Test Item');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v2/items/99999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toHaveProperty('message', 'Book not found');
    });
  });

  describe('PUT /api/v2/items/:id', () => {
    let itemId;

    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v2/items',
        payload: {
          title: 'Original Title',
          author: 'Original Author',
          genre: 'Fiction',
          year: 2024,
        },
      });

      itemId = response.json().id;
    });

    it('should update item and return 200', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/v2/items/${itemId}`,
        payload: {
          title: 'Updated Title',
          author: 'Updated Author',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('title', 'Updated Title');
    });

    it('should return 404 when updating non-existent item', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v2/items/99999',
        payload: {
          title: 'Updated Title',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v2/items/:id', () => {
    let itemId;

    beforeEach(async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v2/items',
        payload: {
          title: 'Item to Delete',
          author: 'Test Author',
          genre: 'Fiction',
          year: 2024,
        },
      });

      itemId = response.json().id;
    });

    it('should delete item and return 200', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v2/items/${itemId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty('success', true);
    });

    it('should return 404 when deleting non-existent item', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v2/items/99999',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should not find item after deletion', async () => {
      await app.inject({
        method: 'DELETE',
        url: `/api/v2/items/${itemId}`,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v2/items/${itemId}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
