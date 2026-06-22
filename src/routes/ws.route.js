import { createItemsRepository } from '../items.repository.js';
import { eventBus } from '../events/eventBus.js';

export default async function (fastify) {
  fastify.get('/ws', { websocket: true }, async (connection) => {
    const itemsRepository = createItemsRepository(fastify.db);

    const sendItems = async () => {
      const items = await itemsRepository.findAll();

      connection.send(
        JSON.stringify({
          type: 'items',
          payload: items,
        }),
      );
    };

    await sendItems();

    const onCreated = async (item) => {
      connection.send(
        JSON.stringify({
          type: 'created',
          payload: item,
        }),
      );
    };

    const onUpdated = async (item) => {
      connection.send(
        JSON.stringify({
          type: 'updated',
          payload: item,
        }),
      );
    };

    const onDeleted = async (id) => {
      connection.send(
        JSON.stringify({
          type: 'deleted',
          payload: id,
        }),
      );
    };

    eventBus.on('created', onCreated);
    eventBus.on('updated', onUpdated);
    eventBus.on('deleted', onDeleted);

    connection.socket.on('close', () => {
      eventBus.off('created', onCreated);
      eventBus.off('updated', onUpdated);
      eventBus.off('deleted', onDeleted);
    });
  });
}
