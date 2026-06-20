import fs from 'fs/promises';
import path from 'path';

export async function createBackup() {
  const source = path.join(process.cwd(), 'data', 'items');

  const backupRoot = path.join(process.cwd(), 'data', 'backups');

  const timestamp = Date.now().toString();

  const backupDir = path.join(backupRoot, timestamp);

  await fs.mkdir(backupDir, {
    recursive: true,
  });

  const files = await fs.readdir(source);

  for (const file of files) {
    await fs.copyFile(path.join(source, file), path.join(backupDir, file));
  }

  const backups = await fs.readdir(backupRoot);

  if (backups.length > 5) {
    backups.sort();

    const oldBackups = backups.slice(0, backups.length - 5);

    for (const folder of oldBackups) {
      await fs.rm(path.join(backupRoot, folder), {
        recursive: true,
      });
    }
  }
}
