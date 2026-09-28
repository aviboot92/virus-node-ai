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

// ===============
app.get('/', (req, res) => {
  res.json({
    message: 'VIRUS-AI-CHATBOT running',
  });
});

// ==========
app.post('/chat', async (req, res) => {
  console.log(req, res);
});

// ============Initialising the server============
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Chatbot API running on http://localhost:${PORT}`);
});
