import { eq } from 'drizzle-orm';
import { items } from './db/schema.js';

export function createItemsRepository(db) {
  return {
    async findAll() {
      return db
        .select({
          id: items.id,
          name: items.name,
          description: items.description,
        })
        .from(items)
        .orderBy(items.id);
    },

    async findById(id) {
      const rows = await db
        .select({
          id: items.id,
          name: items.name,
          description: items.description,
        })
        .from(items)
        .where(eq(items.id, id))
        .limit(1);

      return rows[0] ?? null;
    },

    async create(data) {
      const { name, description = null } = data;

      const result = await db.insert(items).values({
        name,
        description,
      });

      return {
        id: result?.[0]?.insertId ?? null,
        name,
        description,
      };
    },

    async update(id, body) {
      const existing = await this.findById(id);
      if (!existing) return null;

      const updated = {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
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
