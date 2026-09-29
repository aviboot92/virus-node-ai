import { prisma } from './prisma.js';

async function main() {
  // 1. Create a test user
  const user = await prisma.user.upsert({
    where: {
      externalId: 'test-user-001',
    },
    update: {},
    create: {
      externalId: 'test-user-001',
      name: 'Test User',
    },
  });

  // 2. Create a conversation for that user
  const conversation = await prisma.conversation.create({
    data: {
      threadId: `test-thread-${Date.now()}`,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  console.log('User:', user);
  console.log('Conversation:', conversation);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
