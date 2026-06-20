import crypto from 'crypto';
import fs from 'fs/promises';

import model from './models/item.model.js';

const hash = crypto
  .createHash('md5')
  .update(JSON.stringify(model))
  .digest('hex');

await fs.writeFile(
  'data/version.json',
  JSON.stringify({
    hash,
  }),
);

console.log('Migration done');
