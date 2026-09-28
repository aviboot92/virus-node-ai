import { AIMessage } from '@langchain/core/messages';
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
  BaseCheckpointSaver,
  MemorySaver,
} from '@langchain/langgraph';

// ==========ConceptualRoadMap=======
// Chatbot
// │
// ├── chatbotModal
// │      └── ChatOllama
// │
// ├── chatbotGraph
// │      └── LangGraph
// │
// ├── constructor()
// │      ├── Create Ollama
// │      ├── Define State
// │      ├── Define Node
// │      ├── Create MemorySaver
// │      └── Build Graph
// │
// └── chat()
//        ├── Accept message
//        ├── Accept threadId
//        ├── Invoke graph
//        └── Return AI response

//========== *@langchain*
// ollama
// export OLLAMA_BASE_URL="http://127.0.0.1:11434"
//  # Optional; defaults to http://127.0.0.1:11434 if not set

import { ChatOllama } from '@langchain/ollama';

type ChatbotNodeReturnValue = {
  messages: AIMessage[];
};

export type MemoryMode = 'ephemeral' | 'persistent';

export class VirusChatbot {
  // ==========Private properties==========
  private chatbotModal: ChatOllama;
  private ephemeralGraph;
  private persistentGraph;

  //============constructor============
  constructor(persistentCheckpointer: BaseCheckpointSaver) {
    // 1. Create Ollama Modal
    this.chatbotModal = new ChatOllama({
      model: 'llama3.2',
      temperature: 0.3,
    });

    // 2. Define Graph State
    const chatbotState = new StateSchema({
      messages: MessagesValue,
    });

    // 3. Define Chatbot Node which returns as ChatbotNodeReturnValue
    const chatbotNode = async (
      stateAsArg: typeof chatbotState.State,
    ): Promise<ChatbotNodeReturnValue> => {
      const modalResponse = await this.chatbotModal.invoke(stateAsArg.messages);
      const returnValue = { messages: [modalResponse] };
      return returnValue;
    };

    // 4. Ephemeral memory
    const memorySaver = new MemorySaver();
    this.ephemeralGraph = new StateGraph(chatbotState)
      .addNode('chatbot', chatbotNode)
      .addEdge(START, 'chatbot')
      .addEdge('chatbot', END)
      .compile({
        checkpointer: memorySaver,
      });

    // 5. Persistent memory
    this.persistentGraph = new StateGraph(chatbotState)
      .addNode('chatbot', chatbotNode)
      .addEdge(START, 'chatbot')
      .addEdge('chatbot', END)
      .compile({
        checkpointer: persistentCheckpointer,
      });
  }

  // Public method used by our API
  public async chat(
    message: string,
    threadId: string = 'default-user',
    memoryMode: MemoryMode = 'persistent',
  ) {
    let returnValue;
    // Select graph based on memory mode
    const graph =
      memoryMode === 'ephemeral' ? this.ephemeralGraph : this.persistentGraph;
    // Run the LangGraph
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
    // Get the latest message
    const lastMessage = result?.messages[result.messages.length - 1];
    // Safety check
    if (!lastMessage) {
      throw new Error('No response recieved from chatbot');
    }
    // return AI response-content
    returnValue = lastMessage.content;
    return returnValue;
  }
}
