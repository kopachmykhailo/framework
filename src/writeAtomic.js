import fs from 'fs/promises';

export const writeAtomic = async (filePath, data) => {
  const tmpPath = `${filePath}.tmp`;

  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');

  await fs.rename(tmpPath, filePath);
};
