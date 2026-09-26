import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';
import { error } from 'node:console';

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
    const response = await model.invoke([
      new HumanMessage(message),
      new SystemMessage(
        'You are a helpful AI assistant. Keep your answers clear and concise',
      ),
    ]);
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
