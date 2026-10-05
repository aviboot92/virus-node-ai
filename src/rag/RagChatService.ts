import { ChatOllama } from '@langchain/ollama';
import { RagService } from './RagService.js';

export class RagChatService {
  private model: ChatOllama;
  private rag: RagService;

  constructor() {
    this.model = new ChatOllama({
      model: 'llama3.2',
      temperature: 0,
    });
    this.rag = new RagService();
  }

  async ask(question: string): Promise<string> {
    const context = await this.rag.retrieve(question, 3);
    const prompt = `
        You are a helpful assistant.
        Answer the user's question using only the provided context.
        If the answer cannot be found in the context, say:
        "I don't have enough information in my knowledge base."
        Context:
        ${context}
        Question:
        ${question}
        Answer:
        `;
    const response = await this.model.invoke(prompt);
    return response.content.toString();
  }
}
