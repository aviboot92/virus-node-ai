import express from 'express';
import cors from 'cors';

import { VirusChatbot } from './chatbot/VirusChatbot.js';
import { postgresCheckpointer } from './memory/PostgresCheckpointer.js';
import { createChatRouter } from './routes/chat.routes.js';

// Server port configuration.
// This is the local port used to expose the Virus AI Bot API.
const PORT = 5000;

// Bootstraps the application.
// It prepares the memory layer and starts the Express server.
async function startServer() {
  // Initialize the PostgreSQL memory setup before serving requests.
  await postgresCheckpointer.setup();

  // Create the Express app that handles incoming HTTP requests.
  const app = express();

  // Allow browser clients to call the API from different origins.
  app.use(cors());
  // Parse incoming JSON request bodies so chat payloads are readable.
  app.use(express.json());

  // Instantiate the chatbot engine that powers the conversation flow.
  const chatbot = new VirusChatbot();

  // Simple health check endpoint.
  // Useful for verifying that the bot service is alive and responding.
  app.get('/', (_req, res) => {
    res.json({
      message: 'Virus AI Bot is running',
    });
  });

  // Mount the chat API under /chat.
  // All chat requests are routed through the chatbot router.
  app.use('/chat', createChatRouter(chatbot));

  // Start listening for incoming requests on the configured port.
  app.listen(PORT, () => {
    console.log(`VirusAI Server running on http://localhost:${PORT}`);
  });
}

// Run the server and fail fast if startup breaks.
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
