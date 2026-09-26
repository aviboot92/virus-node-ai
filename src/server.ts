import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { ChatOpenAI } from '@langchain/openai';

// ======Creating express app=========
const app = express();

// ===========
app.use(cors());
app.use(express.json());

// ========Defining OPENAI Model=======
const model = new ChatOpenAI({
  model: 'gpt-5-mini',
  temperature: 0.7,
});

// ===============
app.get('/', (req, res) => {
  res.json({
    message: 'VIRUS-AI-CHATBOT running',
  });
});

// ==========
app.post('/chat', (req, res) => {
  res.json({
    message: 'test',
  });
});

// ============Initialising the server============
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Chatbot API running on http://localhost:${PORT}`);
});
