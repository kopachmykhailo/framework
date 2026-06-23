import { eq } from 'drizzle-orm';
import { books } from './db/schema.js';

export function createItemsRepository(db) {
  return {
    // GET ALL
    async findAll() {
      return await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          year: books.year,
          genre: books.genre,
          image: books.image,
        })
        .from(books)
        .orderBy(books.id);
    },

    // GET BY ID
    async findById(id) {
      const rows = await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          year: books.year,
          genre: books.genre,
          image: books.image,
        })
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    // CREATE
    async create(data) {
      const { title, author, year, genre, image = null } = data;

      const result = await db.insert(books).values({
        title,
        author,
        year,
        genre,
        image,
      });

      return {
        id: result[0]?.insertId ?? null,
        title,
        author,
        year,
        genre,
        image,
      };
    },

    // UPDATE
    async update(id, body) {
      const existing = await this.findById(id);

      if (!existing) return null;

      const updated = {
        title: body.title ?? existing.title,
        author: body.author ?? existing.author,
        year: body.year ?? existing.year,
        genre: body.genre ?? existing.genre,
        image: Object.prototype.hasOwnProperty.call(body, 'image')
          ? body.image
          : existing.image,
      };

      await db.update(books).set(updated).where(eq(books.id, id));

      return {
        id: Number(id),
        ...updated,
      };
    },

    // DELETE
    async remove(id) {
      const existing = await this.findById(id);

      if (!existing) return null;

      await db.delete(books).where(eq(books.id, id));

      return existing;
    },
  };
}
