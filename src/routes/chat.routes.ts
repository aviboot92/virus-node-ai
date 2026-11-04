import { Router } from 'express';
import { VirusChatbot } from '../chatbot/VirusChatbot.js';
import type { MemoryMode } from '../types/chatbot.js';
import type { ChatRequest, ChatResponse } from '../types/api.js';

// ====================CHAT ROUTER==============

// ===Chat router timeout=====
const CHAT_TIMEOUT = 30_000;

export function createChatRouter(chatbot: VirusChatbot) {
  const router = Router();

  router.post('/', async (req, res) => {
    let timeoutId: NodeJS.Timeout | undefined;
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

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('CHAT_REQUEST_TIMEOUT'));
        }, CHAT_TIMEOUT);
      });

      const reply = await Promise.race([
        chatbot.chat(message, threadId, memoryMode as MemoryMode),
        timeoutPromise,
      ]);

      const response: ChatResponse = {
        reply,
        threadId,
        memoryMode,
      };

      return res.json(response);
    } catch (error) {
      console.error('Chat error:', error);
      // Timeout Error
      if (error instanceof Error && error.message === 'CHAT_REQUEST_TIMEOUT') {
        return res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Chatbot took too long to respond. Please try again.',
        });
      }
      // PostgreSQL Error
      if (
        error instanceof Error &&
        error.message.includes('PostgreSQL is unavailable')
      ) {
        return res.status(503).json({
          error: 'PostgreSQL is unavailable',
          message:
            'Please install and start PostgreSQL, or use SQLite instead.',
          suggestedMemoryMode: 'sqlite',
        });
      }
      // Network Error
      return res.status(500).json({
        error: 'Failed to process chat request',
      });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  });

  return router;
}
