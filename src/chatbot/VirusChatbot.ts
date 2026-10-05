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

  // Initialising modal and graph state instances using constructor
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
  // Heart of the ARCHITECTURE. Refer README docs
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
  // It invokes State Graph for every new Instance it is created
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
You are a conversational AI assistant with persistent conversation memory.

Use the conversation history to answer normal conversational questions and remember information the user has previously provided.

Use the provided knowledge when the user's question requires information from the knowledge base.

Knowledge:
${context || '(No relevant knowledge was found.)'}

User message:
${message}

Rules:
1. If this is normal conversation, respond naturally.
2. If the user provides personal information such as their name, acknowledge it and remember it through the conversation memory.
3. If the user asks about something discussed earlier, use the conversation history.
4. If the question requires knowledge from the knowledge base, use the provided Knowledge.
5. Do not invent facts that are not present in the conversation history or Knowledge.
6. If a factual knowledge question cannot be answered from the Knowledge, say:
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
