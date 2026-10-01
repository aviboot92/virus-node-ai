import { ChatOllama } from '@langchain/ollama';
import { MemorySaver } from '@langchain/langgraph';

import { createChatbotGraph } from './chatbot.graph.js';
import { ChatbotGraph, type MemoryMode } from '../types/chatbot.js';

import { postgresCheckpointer } from '../memory/PostgresCheckpointer.js';
import { sqliteCheckpointer } from '../memory/SqliteCheckpointer.js';
import { RagService } from '../rag/RagService.js';

export class VirusChatbot {
  // This is state is responsible for model
  private chatbotModel: ChatOllama;
  // This is state is responsible for Graphs
  // These graphs have two memories one is Ephemeral for RAM Memory
  private ephemeralGraph: ChatbotGraph;
  // These graphs have two memories one is Ephemeral for ROM Memory
  private sqliteGraph: ChatbotGraph;
  private postgreGraph?: ChatbotGraph;
  // This is the RAG_SERVICE State.
  private ragService: RagService;

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
    this.ragService = new RagService();
  }

  private getGraph(memoryMode: MemoryMode): ChatbotGraph {
    switch (memoryMode) {
      case 'ephemeral':
        return this.ephemeralGraph;

      case 'postgres':
        try {
          if (!this.postgreGraph) {
            this.postgreGraph = createChatbotGraph(
              this.chatbotModel,
              postgresCheckpointer,
            );
          }

          return this.postgreGraph;
        } catch (error) {
          console.error('PostgreSQL initialization error:', error);

          throw new Error(
            'PostgreSQL is unavailable. Please install and start PostgreSQL, or use SQLite instead.',
          );
        }

      case 'sqlite':
      default:
        return this.sqliteGraph;
    }
  }

  async chat(message: string, threadId: string, memoryMode: MemoryMode) {
    const graph = this.getGraph(memoryMode);
    const context = await this.ragService.retrieve(message, 3);
    try {
      const result = await graph.invoke(
        {
          messages: [
            {
              role: 'human',
              content: `
                  Answer the user's question using the provided knowledge.

                  Knowledge:
                  ${context}

                  User question:
                  ${message}

                  If the answer cannot be found in the knowledge, say:
                  "I don't have enough information in my knowledge base."
                  `,
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
    } catch (error) {
      if (memoryMode === 'postgres') {
        console.error('PostgreSQL error:', error);

        throw new Error(
          'PostgreSQL is unavailable. Please install and start PostgreSQL, or use SQLite instead.',
        );
      }

      throw error;
    }
  }
}
