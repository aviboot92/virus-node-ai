import { ChatOllama } from '@langchain/ollama';
import { splitDocument } from './documents/loader.js';
import { createVectorStore } from './vectorstore/vectorstore.js';

const model = new ChatOllama({
  model: 'llama3.2',
  temperature: 0,
});

export async function askRag(
  question: string,
  content: string,
): Promise<string> {
  // 1. Split document into chunks
  const documents = await splitDocument(content);
  // 2. Create Vector store
  const vectorStore = await createVectorStore(documents);
  // 3. Retrieve relevant chunks
  const results = await vectorStore.similaritySearch(question, 3);
  // 4. Build context
  const context = results.map((document) => document.pageContent).join('\n\n');
  // 5. Give retieved context to Llama LLM
  const prompt = `Answer the question using only the provided context.
  Context: ${context}
  Question: ${question}
  `;
  // 6. Generate answer
  const response = await model.invoke(prompt);
  return response.content.toString();
}
