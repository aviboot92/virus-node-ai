import { Router } from 'express';
import { VirusChatbot, type MemoryMode } from '../chatbot/VirusChatbot.js';

export function createChatRouter(chatbot: VirusChatbot) {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const {
        message,
        threadId = 'default-user',
        memoryMode = 'persistent',
      } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'message is required',
        });
      }

      if (memoryMode !== 'ephemeral' && memoryMode !== 'persistent') {
        return res.status(400).json({
          error: "memoryMode must be 'ephemeral' or 'persistent'",
        });
      }

      const reply = await chatbot.chat(
        message,
        threadId,
        memoryMode as MemoryMode,
      );

      return res.json({
        reply,
        threadId,
        memoryMode,
      });
    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({
        error: 'Failed to process chat request',
      });
    }
  });

  return router;
}
