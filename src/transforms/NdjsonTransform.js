import { Transform } from 'stream';

export class NdjsonTransform extends Transform {
  constructor() {
    super({
      objectMode: true,
    });
  }

  _transform(chunk, encoding, callback) {
    callback(null, JSON.stringify(chunk) + '\n');
  }
}
