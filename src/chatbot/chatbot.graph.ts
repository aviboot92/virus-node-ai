import {
  END,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';

import type { ChatOllama } from '@langchain/ollama';
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';

const chatbotState = new StateSchema({
  messages: MessagesValue,
});

export function createChatbotGraph(
  model: ChatOllama,
  checkpointer: BaseCheckpointSaver,
) {
  const chatbotNode = async (state: typeof chatbotState.State) => {
    const modelResponse = await model.invoke(state.messages);

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
