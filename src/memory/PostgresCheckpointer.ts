import 'dotenv/config';

import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

export const postgresCheckpointer =
  PostgresSaver.fromConnString(connectionString);
