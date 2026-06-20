import {
  getSharedReposV1,
  getSharedReposV2,
} from '../services/github.service.js';

export default async function (fastify) {
  fastify.get('/shared-repos', async (request, reply) => {
    const { repo } = request.query;

    if (!repo) {
      return reply.code(400).send({
        message: 'repo query parameter is required',
      });
    }

    try {
      const isV2 = request.url.includes('/api/v2/');

      const result = isV2
        ? await getSharedReposV2(repo)
        : await getSharedReposV1(repo);

      return {
        repository: repo,
        sharedRepositories: result,
      };
    } catch (error) {
      return reply.code(500).send({
        message: error.message,
      });
    }
  });
}
