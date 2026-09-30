import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { embeddings } from '../embeddings/embeddings.js';

export async function createVectorStore(documents: any[]) {
  return MemoryVectorStore.fromDocuments(documents, embeddings);
}
