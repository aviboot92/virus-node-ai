import { ChatOllama } from '@langchain/ollama';
import { MemorySaver } from '@langchain/langgraph';

import { createChatbotGraph } from './chatbot.graph.js';

import { ChatbotGraph, type MemoryMode } from './types.js';

import { postgresCheckpointer } from '../memory/PostgresCheckpointer.js';

export class VirusChatbot {
  private chatbotModel: ChatOllama;
  private ephemeralGraph: ChatbotGraph;
  private persistentGraph: ChatbotGraph;

  constructor() {
    this.chatbotModel = new ChatOllama({
      model: 'llama3.2',
      temperature: 0,
    });

    this.ephemeralGraph = createChatbotGraph(
      this.chatbotModel,
      new MemorySaver(),
    );

    this.persistentGraph = createChatbotGraph(
      this.chatbotModel,
      postgresCheckpointer,
    );
  }

  private getGraph(memoryMode: MemoryMode) {
    return memoryMode === 'ephemeral'
      ? this.ephemeralGraph
      : this.persistentGraph;
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
    return lastMessage.content;
  }
}
