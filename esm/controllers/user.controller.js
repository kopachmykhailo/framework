import * as userService from '../services/user.service.js';
import { increment } from '../state/request-counter.js';

export const getUsers = async (request, reply) => {
  increment();

  const users = await userService.getPublicUsers();
  return { users };
};

export const getUserById = async (request, reply) => {
  increment();

  const { id } = request.params;
  const user = await userService.getUserById(id);

  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return { user };
};