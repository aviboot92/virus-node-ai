import { prisma } from '../database/prisma.js';
import crypto from 'node:crypto';

export async function getOrCreateUser(externalId: string, name?: string) {
  return prisma.user.upsert({
    where: {
      externalId,
    },
    update: {
      name,
    },
    create: {
      externalId,
      name,
    },
  });
}

export async function createConversation(userId: string) {
  const threadId = crypto.randomUUID();

  return prisma.conversation.create({
    data: {
      threadId,
      userId,
    },
  });
}
