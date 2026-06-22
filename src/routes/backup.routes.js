import fs from 'fs';
import path from 'path';

export default async function backupRoutes(fastify) {
  fastify.get('/backups/:timestamp', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];
    const validKey = fastify.config.ADMIN_API_KEY;

    if (!apiKey || apiKey !== validKey) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { timestamp } = request.params;

    const filePath = path.join(
      process.cwd(),
      'data/backups',
      `${timestamp}.gz`,
    );

    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({ error: 'Backup not found' });
    }

    return reply
      .header('Content-Type', 'application/gzip')
      .header('Content-Disposition', `attachment; filename=${timestamp}.gz`)
      .send(fs.createReadStream(filePath));
  });
}
