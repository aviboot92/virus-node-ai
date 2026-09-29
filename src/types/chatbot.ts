import { createChatbotGraph } from '../chatbot/chatbot.graph.js';

export type MemoryMode = 'ephemeral' | 'sqlite' | 'postgres';
export type ChatbotGraph = ReturnType<typeof createChatbotGraph>;
