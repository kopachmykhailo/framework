import mongoose from 'mongoose';
import { BookModel } from './db/models/book.model.js';

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

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB_NAME;

await mongoose.connect(`${mongoUrl}/${dbName}`);

await BookModel.deleteMany({});
await BookModel.insertMany(books);

console.log('Force seed complete');

await mongoose.connection.close();
