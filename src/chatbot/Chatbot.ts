import { AIMessage } from '@langchain/core/messages';
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
  MemorySaver,
} from '@langchain/langgraph';

//========== *@langchain*
// /ollama
// export OLLAMA_BASE_URL="http://127.0.0.1:11434"
//  # Optional; defaults to http://127.0.0.1:11434 if not set

import { ChatOllama } from '@langchain/ollama';

type ChatbotNodeReturnValue = {
  messages: AIMessage[];
};

export class Chatbot {
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
    // 5. Build LangGraph
  }
}
