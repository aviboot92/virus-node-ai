import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { embeddings } from '../embeddings/embeddings.js';

export async function createVectorStore(documentChunks: any[]) {
  return MemoryVectorStore.fromDocuments(documentChunks, embeddings);
}
