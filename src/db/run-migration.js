import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function runMigration(fastify) {
  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf-8');

  const schemaHash = crypto
    .createHash('sha256')
    .update(schemaSql)
    .digest('hex');

  // Create tables from schema
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await fastify.db.query(statement);
  }

  // Check migrations hash
  const [rows] = await fastify.db.query(
    `
      SELECT schema_hash
      FROM migrations
      ORDER BY id DESC
      LIMIT 1
    `,
  );

  const lastHash = rows[0]?.schema_hash ?? null;

  if (lastHash && lastHash !== schemaHash) {
    fastify.log.warn(
      'Database schema hash differs from the last applied migration.',
    );
  }

  if (lastHash !== schemaHash) {
    await fastify.db.query(
      `
        INSERT INTO migrations (schema_hash)
        VALUES (?)
      `,
      [schemaHash],
    );
  }
}
