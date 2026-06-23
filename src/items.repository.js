export function createItemsRepository(db) {
  return {
    async findAll() {
      const [rows] = await db.query(`
        SELECT id, title, author, year, genre, image
        FROM books
        ORDER BY id ASC
      `);

      return rows;
    },

    async findById(id) {
      const [rows] = await db.query(
        `
          SELECT id, title, author, year, genre, image
          FROM books
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

      return rows[0] ?? null;
    },

    async create(data) {
      const { title, author, year, genre, image = null } = data;

      const [result] = await db.query(
        `
          INSERT INTO books (title, author, year, genre, image)
          VALUES (?, ?, ?, ?, ?)
        `,
        [title, author, year, genre, image],
      );

      return {
        id: result.insertId,
        title,
        author,
        year,
        genre,
        image,
      };
    },

    async update(id, body) {
      const existing = await this.findById(id);

      if (!existing) {
        return null;
      }

      const updated = {
        title: body.title ?? existing.title,
        author: body.author ?? existing.author,
        year: body.year ?? existing.year,
        genre: body.genre ?? existing.genre,
        image: Object.prototype.hasOwnProperty.call(body, 'image')
          ? body.image
          : existing.image,
      };

      await db.query(
        `
          UPDATE books
          SET title = ?, author = ?, year = ?, genre = ?, image = ?
          WHERE id = ?
        `,
        [
          updated.title,
          updated.author,
          updated.year,
          updated.genre,
          updated.image,
          id,
        ],
      );

      return {
        id: Number(id),
        ...updated,
      };
    },

    async remove(id) {
      const existing = await this.findById(id);

      if (!existing) {
        return null;
      }

      await db.query(
        `
          DELETE FROM books
          WHERE id = ?
        `,
        [id],
      );

      return existing;
    },
  };
}
