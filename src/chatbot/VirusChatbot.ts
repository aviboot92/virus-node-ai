import { ChatOllama } from '@langchain/ollama';
import {
  END,
  MemorySaver,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';

import { postgresCheckpointer } from '../memory/PostgresCheckpointer.js';

export type MemoryMode = 'ephemeral' | 'persistent';

export class VirusChatbot {
  private chatbotModel: ChatOllama;
  private ephemeralGraph;
  private persistentGraph;

  constructor() {
    this.chatbotModel = new ChatOllama({
      model: 'llama3.2',
      temperature: 0,
    });
    this.ephemeralGraph = this.createGraph(new MemorySaver());
    this.persistentGraph = this.createGraph(postgresCheckpointer);
  }

  private createGraph(checkpointer: BaseCheckpointSaver) {
    const chatbotState = new StateSchema({
      messages: MessagesValue,
    });

    const chatbotNode = async (state: typeof chatbotState.State) => {
      const modelResponse = await this.chatbotModel.invoke(state.messages);

      return {
        messages: [modelResponse],
      };
    };

    return new StateGraph(chatbotState)
      .addNode('chatbot', chatbotNode)
      .addEdge(START, 'chatbot')
      .addEdge('chatbot', END)
      .compile({
        checkpointer,
      });
  }

  async chat(message: string, threadId: string, memoryMode: MemoryMode) {
    const graph =
      memoryMode === 'ephemeral' ? this.ephemeralGraph : this.persistentGraph;

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
