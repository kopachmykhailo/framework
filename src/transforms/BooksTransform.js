import { Transform } from 'stream';

export class BooksTransform extends Transform {
  constructor() {
    super({
      objectMode: true,
    });
  }

  _transform(book, encoding, callback) {
    const currentYear = new Date().getFullYear();

    callback(null, {
      ...book,
      age: currentYear - Number(book.year),
    });
  }
}
