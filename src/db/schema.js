import { mysqlTable, int, varchar, text } from 'drizzle-orm/mysql-core';

export const items = mysqlTable('items', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
});
