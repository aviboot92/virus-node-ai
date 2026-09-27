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

export class Chatbot {
  // ==========Private properties==========
  private chatbotModal: ChatOllama;
  private chatbotGraph;

  //============constructor============
  // 1. Create Ollama Modal
  // 2. Define Graph State
  // 3. Define Chatbot Node
  // 4. Create memory/checkpointer
  // 5. Build LangGraph
}
