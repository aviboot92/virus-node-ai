import { readFile } from 'node:fs/promises';
import { splitDocument } from './documents/loader.js';
import { createVectorStore } from './vectorstore/vectorstore.js';

export class RagService {
  private vectorStore: Awaited<ReturnType<typeof createVectorStore>> | null =
    null;

  async initialize(): Promise<void> {
    if (this.vectorStore) {
      return;
    }
    const content = await readFile(
      new URL('./documents/knowledge.txt', import.meta.url),
      'utf-8',
    );
    const documents = await splitDocument(content);
    this.vectorStore = await createVectorStore(documents);
  }

  async retrieve(question: string, limit = 3): Promise<string> {
    await this.initialize();
    if (!this.vectorStore) {
      throw new Error('RAG vector store is not initialized');
    }
    const results = await this.vectorStore.similaritySearch(question, limit);
    return results.map((document) => document.pageContent).join('\n\n');
  }
}
