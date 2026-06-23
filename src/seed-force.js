import mysql from 'mysql2/promise';

const books = [
  {
    title: 'Clean Code',
    author: 'Robert Martin',
    year: 2008,
    genre: 'Programming',
    image: null,
  },
  {
    title: 'JavaScript: The Definitive Guide',
    author: 'David Flanagan',
    year: 2020,
    genre: 'Programming',
    image: null,
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    year: 1937,
    genre: 'Fantasy',
    image: null,
  },
];

const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

await db.query('DELETE FROM books');
await db.query('ALTER TABLE books AUTO_INCREMENT = 1');

for (const book of books) {
  await db.query(
    `
      INSERT INTO books (title, author, year, genre, image)
      VALUES (?, ?, ?, ?, ?)
    `,
    [book.title, book.author, book.year, book.genre, book.image],
  );
}

console.log('Force seed complete');

await db.end();
