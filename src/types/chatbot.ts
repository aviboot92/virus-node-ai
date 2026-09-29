import { createChatbotGraph } from '../chatbot/chatbot.graph.js';

export type MemoryMode = 'ephemeral' | 'persistent';
export type ChatbotGraph = ReturnType<typeof createChatbotGraph>;
