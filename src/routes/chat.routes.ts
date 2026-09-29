import { Router } from 'express';
import { VirusChatbot } from '../chatbot/VirusChatbot.js';
import type { MemoryMode } from '../types/chatbot.js';
import type { ChatRequest, ChatResponse } from '../types/api.js';

export function createChatRouter(chatbot: VirusChatbot) {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const {
        message,
        threadId = 'default-user',
        memoryMode = 'sqlite',
      } = req.body as Partial<ChatRequest>;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'message is required',
        });
      }

      if (
        memoryMode !== 'ephemeral' &&
        memoryMode !== 'sqlite' &&
        memoryMode !== 'postgres'
      ) {
        return res.status(400).json({
          error: "memoryMode must be 'ephemeral', 'sqlite', or 'postgres'",
        });
      }

      const reply = await chatbot.chat(
        message,
        threadId,
        memoryMode as MemoryMode,
      );

      const response: ChatResponse = {
        reply,
        threadId,
        memoryMode,
      };

      return res.json(response);
    } catch (error) {
      console.error('Chat error:', error);

      return res.status(500).json({
        error: 'Failed to process chat request',
      });
    }
  });

  return router;
}
