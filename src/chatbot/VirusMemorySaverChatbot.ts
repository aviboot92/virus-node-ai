import { AIMessage } from '@langchain/core/messages';
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
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

export class VirusMemorySaverChatbot {
  // ==========Private properties==========
  private chatbotModal: ChatOllama;
  private chatbotGraph;

  //============constructor============
  constructor() {
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

    // 4. Create memory/checkpointer
    const checkpointer = new MemorySaver();

    // 5. Build LangGraph
    this.chatbotGraph = new StateGraph(chatbotState)
      .addNode('chatbot', chatbotNode)
      .addEdge(START, 'chatbot')
      .addEdge('chatbot', END)
      .compile({
        checkpointer,
      });
  }

  // Public method used by our API
  public async chat(message: string, threadId: string = 'default-user') {
    let returnValue;
    // Run the LangGraph
    const result = await this.chatbotGraph.invoke(
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
    console.log('lastMessage', lastMessage.content);
    return returnValue;
  }
}
