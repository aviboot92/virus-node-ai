import type { MemoryMode } from './chatbot.js';

export interface ChatRequest {
  message: string;
  threadId: string;
  memoryMode: MemoryMode;
}

export interface ChatResponse {
  reply: string;
  threadId: string;
  memoryMode: MemoryMode;
}
