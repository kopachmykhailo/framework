import fs from 'fs/promises';
import path from 'path';

const books = [
  {
    id: '1',
    title: 'Clean Code',
    author: 'Robert Martin',
    year: 2008,
    genre: 'Programming',
    image: null,
  },
  {
    id: '2',
    title: 'JavaScript',
    author: 'David Flanagan',
    year: 2020,
    genre: 'Programming',
    image: null,
  },
];

const dir = path.join(process.cwd(), 'data', 'items');

await fs.mkdir(dir, {
  recursive: true,
});

for (const book of books) {
  await fs.writeFile(
    path.join(dir, `${book.id}.json`),
    JSON.stringify(book, null, 2),
  );
}

console.log('Seed complete');
