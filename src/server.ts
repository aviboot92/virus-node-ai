import express from 'express';
import cors from 'cors';

import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
  MemorySaver,
} from '@langchain/langgraph';
import { ChatOllama } from '@langchain/ollama';

// ======Creating express app=========
const app = express();

// ===========
app.use(cors());
app.use(express.json());

// ========Defining Ollama Model=======
const model = new ChatOllama({
  model: 'llama3.2',
  temperature: 0.7,
});

// ======State=============
const VirusState = new StateSchema({
  messages: MessagesValue,
});

// ============ChatBotNode=========
const chatbot = async (state: typeof VirusState.State) => {
  const response = await model.invoke(state.messages);
  return {
    messages: [response],
  };
};

// ==========Checkpointer and Graph======
const checkpointer = new MemorySaver();
const virusStateGraph = new StateGraph(VirusState)
  .addNode('chatbot', chatbot)
  .addEdge(START, 'chatbot')
  .addEdge('chatbot', END)
  .compile({
    checkpointer,
  });

// ===============
app.get('/', (req, res) => {
  res.json({
    message: 'VIRUS-AI-CHATBOT running',
  });
});

// ==========
app.post('/chat', async (req, res) => {
  try {
    const { message, threadId } = req.body;
    console.log('threadId', threadId);
    if (!message)
      return res.status(400).json({
        error: 'message is a required field',
      });

    const result = await virusStateGraph.invoke(
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

    res.json({
      reply: lastMessage.content,
    });

    //====Add new message and AI response to chat history to build memory=====
  } catch (error) {
    console.log('Error during post of /chat', error);
    res.status(500).json({
      error: 'Failed during response genration',
    });
  }
});

// ============Initialising the server============
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Chatbot API running on http://localhost:${PORT}`);
});
