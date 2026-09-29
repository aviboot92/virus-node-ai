import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';

export const sqliteCheckpointer =
  SqliteSaver.fromConnString('./data/chatbot.db');
