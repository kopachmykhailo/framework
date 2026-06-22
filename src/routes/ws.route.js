import { eventBus } from '../events/eventBus.js';
import { findAll } from '../items.repository.js';

export default async function (fastify) {
  fastify.get(
    '/ws',
    {
      websocket: true,
    },
    async (socket) => {
      const items = await findAll();

      socket.send(
        JSON.stringify({
          event: 'initial',
          data: items,
        }),
      );

      const createdHandler = (item) => {
        socket.send(
          JSON.stringify({
            event: 'created',
            data: item,
          }),
        );
      };

      const updatedHandler = (item) => {
        socket.send(
          JSON.stringify({
            event: 'updated',
            data: item,
          }),
        );
      };

      const deletedHandler = (id) => {
        socket.send(
          JSON.stringify({
            event: 'deleted',
            id,
          }),
        );
      };

      eventBus.on('created', createdHandler);
      eventBus.on('updated', updatedHandler);
      eventBus.on('deleted', deletedHandler);

      socket.on('close', () => {
        eventBus.off('created', createdHandler);
        eventBus.off('updated', updatedHandler);
        eventBus.off('deleted', deletedHandler);
      });
    },
  );
}
