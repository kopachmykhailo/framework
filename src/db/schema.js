import { mysqlTable, int, varchar } from 'drizzle-orm/mysql-core';

export const items = mysqlTable('items', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  genre: varchar('genre', { length: 255 }).notNull(),
  year: int('year').notNull(),
  image: varchar('image', { length: 255 }),
});

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
});
