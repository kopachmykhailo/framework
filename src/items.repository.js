import mongoose from 'mongoose';
import { BookModel } from './db/models/book.model.js';

function normalizeBook(book) {
  if (!book) return null;

  return {
    id: book._id.toString(),
    title: book.title,
    author: book.author,
    year: book.year,
    genre: book.genre,
    image: book.image ?? null,
  };
}

export function createItemsRepository() {
  return {
    async findAll() {
      const books = await BookModel.find().lean();
      return books.map(normalizeBook);
    },

    async findById(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const book = await BookModel.findById(id).lean();
      return normalizeBook(book);
    },

    async create(data) {
      const created = await BookModel.create({
        title: data.title,
        author: data.author,
        year: data.year,
        genre: data.genre,
        image: data.image ?? null,
      });

      return normalizeBook(created.toObject());
    },

    async update(id, body) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const updated = await BookModel.findByIdAndUpdate(
        id,
        { $set: body },
        {
          new: true,
          runValidators: true,
          lean: true,
        },
      );

      return normalizeBook(updated);
    },

    async remove(id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const deleted = await BookModel.findByIdAndDelete(id).lean();
      return normalizeBook(deleted);
    },
  };
}
