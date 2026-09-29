import express from 'express';
import cors from 'cors';

import { VirusChatbot } from './chatbot/VirusChatbot.js';
import { postgresCheckpointer } from './memory/PostgresCheckpointer.js';
import { createChatRouter } from './routes/chat.routes.js';

const PORT = 5000;

async function startServer() {
  await postgresCheckpointer.setup();

  const app = express();

  app.use(cors());
  app.use(express.json());

  const chatbot = new VirusChatbot();

  app.get('/', (_req, res) => {
    res.json({
      message: 'Virus AI Bot is running',
    });
  });

  app.use('/chat', createChatRouter(chatbot));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
