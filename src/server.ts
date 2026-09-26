import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';

// ======Creating express app=========
const app = express();

// ===========
app.use(cors());
app.use(express.json());

// ========Defining OPENAI Model=======
const model = new ChatOllama({
  model: 'llama3.2',
  temperature: 0.7,
});

const defaultSystemMessage = new SystemMessage(
  'You are a helpful AI assistant. Keep your answers clear and concise',
);

// =======Chat History========
const chatHistory: BaseMessage[] = [defaultSystemMessage];

// ===============
app.get('/', (req, res) => {
  res.json({
    message: 'VIRUS-AI-CHATBOT running',
  });
});

// ==========
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({
        error: 'message is a required field',
      });

    //====Add new message and AI response to chat history to build memory=====
    chatHistory.push(new HumanMessage(message));
    const response = await model.invoke(chatHistory);
    chatHistory.push(new AIMessage(response.content.toString()));

    res.json({
      reply: response.content,
    });
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
