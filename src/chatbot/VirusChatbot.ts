import { ChatOllama } from '@langchain/ollama';
import { MemorySaver } from '@langchain/langgraph';
import { createChatbotGraph } from './chatbot.graph.js';
import { ChatbotGraph, type MemoryMode } from '../types/chatbot.js';
import { postgresCheckpointer } from '../memory/PostgresCheckpointer.js';
import { sqliteCheckpointer } from '../memory/SqliteCheckpointer.js';

export class VirusChatbot {
  private chatbotModel: ChatOllama;
  private ephemeralGraph: ChatbotGraph;
  private sqliteGraph: ChatbotGraph;
  private postgreGraph: ChatbotGraph;

  constructor() {
    this.chatbotModel = new ChatOllama({
      model: 'llama3.2',
      temperature: 0,
    });

    this.ephemeralGraph = createChatbotGraph(
      this.chatbotModel,
      new MemorySaver(),
    );

    this.sqliteGraph = createChatbotGraph(
      this.chatbotModel,
      sqliteCheckpointer,
    );

    this.postgreGraph = createChatbotGraph(
      this.chatbotModel,
      postgresCheckpointer,
    );
  }

  private getGraph(memoryMode: MemoryMode) {
    switch (memoryMode) {
      case 'ephemeral':
        return this.ephemeralGraph;

      case 'postgres':
        return this.postgreGraph;

      case 'sqlite':
      default:
        return this.sqliteGraph;
    }
  }

  async chat(message: string, threadId: string, memoryMode: MemoryMode) {
    const graph = this.getGraph(memoryMode);
    const result = await graph.invoke(
      {
        messages: [
          {
            role: 'human',
            content: message,
          },
        ],
      },
      {
        configurable: {
          thread_id: threadId,
        },
      },
    );
    const lastMessage = result.messages[result.messages.length - 1];
    if (!lastMessage) {
      throw new Error('No response received from chatbot');
    }
    const content = lastMessage.content;

    if (typeof content === 'string') {
      return content;
    }

    return content
      .map((block) => {
        if (typeof block === 'string') {
          return block;
        }

        if ('text' in block) {
          return block.text;
        }

        return '';
      })
      .join('');
  }
}
