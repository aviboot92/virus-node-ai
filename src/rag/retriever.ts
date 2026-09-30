import { readFile } from 'node:fs/promises';

import { splitDocument } from './documents/loader.js';
import { createVectorStore } from './vectorstore/vectorstore.js';

export async function retrieveContext(question: string): Promise<string> {
  const content = await readFile(
    new URL('./documents/knowledge.txt', import.meta.url),
    'utf-8',
  );
  const documents = await splitDocument(content);
  const vectorStore = await createVectorStore(documents);
  const results = await vectorStore.similaritySearch(question, 3);
  return results.map((document) => document.pageContent).join('\n\n');
}
