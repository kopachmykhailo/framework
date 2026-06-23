import { eq } from 'drizzle-orm';
import { items } from './db/schema.js';

export function createItemsRepository(db) {
  return {
    async findAll() {
      return db
        .select({
          id: items.id,
          title: items.title,
          author: items.author,
          genre: items.genre,
          year: items.year,
          image: items.image,
        })
        .from(items)
        .orderBy(items.id);
    },

    async findById(id) {
      const rows = await db
        .select({
          id: items.id,
          title: items.title,
          author: items.author,
          genre: items.genre,
          year: items.year,
          image: items.image,
        })
        .from(items)
        .where(eq(items.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    async create(data) {
      const { title, author, genre, year, image = null } = data;

      const result = await db.insert(items).values({
        title,
        author,
        genre,
        year,
        image,
      });

      return {
        id: result?.[0]?.insertId ?? null,
        title,
        author,
        genre,
        year,
        image,
      };
    },

    async update(id, body) {
      const existing = await this.findById(id);
      if (!existing) return null;

      const updated = {
        title: body.title ?? existing.title,
        author: body.author ?? existing.author,
        genre: body.genre ?? existing.genre,
        year: body.year ?? existing.year,
        image: body.image ?? existing.image,
      };

      await db.update(items).set(updated).where(eq(items.id, id));

      return { id: Number(id), ...updated };
    },

    async remove(id) {
      const existing = await this.findById(id);
      if (!existing) return null;

      await db.delete(items).where(eq(items.id, id));

      return existing;
    },
  };
}
