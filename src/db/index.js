import fp from 'fastify-plugin';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { items, users } from './schema.js';

function createTestDb() {
  const state = {
    items: [],
    users: [],
  };

  const nextId = {
    items: 1,
    users: 1,
  };

  const getTableName = (table) => {
    if (table === items) return 'items';
    if (table === users) return 'users';
    if (typeof table === 'string') return table;
    if (table?.tableName) return table.tableName;
    if (table?.name) return table.name;
    return undefined;
  };

  const matchWhere = (predicate, row) => {
    if (!predicate) return true;
    if (predicate.type === 'eq') {
      const column = predicate.column?.name ?? predicate.column;
      const left = row[column];
      const right = predicate.value;

      if (left === right) return true;
      if (left == null || right == null) return false;
      return String(left) === String(right);
    }
    return true;
  };

  const getRows = ({ tableName, predicate, orderBy, limit, offset }) => {
    const rows = [...(state[tableName] ?? [])];
    const filtered = rows.filter((row) => matchWhere(predicate, row));

    if (orderBy) {
      const column = orderBy?.name ?? orderBy;
      filtered.sort((a, b) => {
        if (a[column] > b[column]) return 1;
        if (a[column] < b[column]) return -1;
        return 0;
      });
    }

    const start = offset ?? 0;
    const sliced = filtered.slice(start, limit == null ? undefined : start + limit);

    return sliced;
  };

  const createSelectBuilder = () => {
    const context = {
      columns: null,
      tableName: null,
      predicate: null,
      orderBy: null,
      limit: null,
      offset: 0,
    };

    const builder = {
      select(columns) {
        context.columns = columns;
        return this;
      },
      from(table) {
        context.tableName = getTableName(table);
        return this;
      },
      where(predicate) {
        context.predicate = predicate;
        return this;
      },
      orderBy(column) {
        context.orderBy = column;
        return this;
      },
      limit(value) {
        context.limit = value;
        return this;
      },
      offset(value) {
        context.offset = value;
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve(getRows(context)).then(resolve, reject);
      },
    };

    return builder;
  };

  const createInsertBuilder = (table) => {
    const tableName = getTableName(table);

    return {
      async values(data) {
        const insertId = nextId[tableName]++;
        const row = { id: insertId, ...data };
        state[tableName].push(row);
        return [{ insertId }];
      },
    };
  };

  const createUpdateBuilder = (table) => {
    const tableName = getTableName(table);
    const context = { setData: null, predicate: null };

    return {
      set(data) {
        context.setData = data;
        return this;
      },
      where(predicate) {
        context.predicate = predicate;
        return this;
      },
      async then(resolve, reject) {
        const rows = getRows({
          tableName,
          predicate: context.predicate,
        });

        rows.forEach((row) => Object.assign(row, context.setData));
        return Promise.resolve([{ affectedRows: rows.length }]).then(resolve, reject);
      },
    };
  };

  const createDeleteBuilder = (table) => {
    const tableName = getTableName(table);
    const context = { predicate: null };

    return {
      where(predicate) {
        context.predicate = predicate;
        return this;
      },
      async then(resolve, reject) {
        const removed = getRows({
          tableName,
          predicate: context.predicate,
        });

        state[tableName] = state[tableName].filter((row) => !removed.includes(row));
        return Promise.resolve([{ affectedRows: removed.length }]).then(resolve, reject);
      },
    };
  };

  return {
    schema: {
      items,
      users,
    },
    eq(column, value) {
      return {
        type: 'eq',
        column,
        value,
      };
    },
    select() {
      return createSelectBuilder();
    },
    insert(table) {
      return createInsertBuilder(table);
    },
    update(table) {
      return createUpdateBuilder(table);
    },
    delete(table) {
      return createDeleteBuilder(table);
    },
    query: {
      items: {
        async findMany({ limit = 10, offset = 0 } = {}) {
          return getRows({
            tableName: 'items',
            limit,
            offset,
          });
        },
      },
    },
  };
}

export default fp(async (fastify) => {
  if (process.env.NODE_ENV === 'test') {
    fastify.decorate('db', createTestDb());
    return;
  }

  const pool = mysql.createPool({
    host: fastify.config.DB_HOST,
    port: fastify.config.DB_PORT,
    user: fastify.config.DB_USER,
    password: fastify.config.DB_PASSWORD,
    database: fastify.config.DB_NAME,
  });

  const db = drizzle(pool);

  fastify.decorate('db', db);
});
