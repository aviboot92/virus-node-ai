import express from 'express';
import cors from 'cors';
import { VirusMemorySaverChatbot } from './chatbot/VirusMemorySaverChatbot.js';
import { postgresCheckpointer } from './memory/PostgresCheckpointer.js';

// ======Creating express app=========
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

async function startServer() {
  // Initialize LangGraph PostgreSQL tables
  await postgresCheckpointer.setup();
  // Create chatbot instance
  const chatbot = new VirusMemorySaverChatbot(postgresCheckpointer);
  // console.log('chatbot', chatbot);

  // Healthcheck
  app.get('/', (req, res) => {
    res.json({
      message: 'VIRUS-AI-CHATBOT running',
    });
  });

  // Session Memory chat where memory gets reset/cleared on restart of server
  app.post('/chat', async (req, res) => {
    try {
      const { message = '', threadId } = req.body;
      // Message validation
      if (!message)
        res.status(400).json({
          error: 'message is a required field',
        });
      // Send message to chatbot
      const chatbotReply = await chatbot.chat(message, threadId);
      console.log('chatbotReply', chatbotReply);
      // Send chatbot response
      res.json({
        reply: chatbotReply,
      });
    } catch (error) {
      console.error('Error during POST /chat:', error);
      res.status(500).json({
        error: 'Failed during chat response generation',
      });
    }
  });

  // ============Initialising the server============
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Chatbot API running on http://localhost:${PORT}`);
  });
}

// ======Starting the Server======
startServer().catch((error) => {
  console.error('Failed to start server:', error);

  process.exit(1);
});
