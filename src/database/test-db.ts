import { prisma } from './prisma.js';

async function main() {
  // 1. Find existing conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      threadId: 'test-thread-001',
    },
  });

  // 2. Create if it doesn't exist
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        threadId: 'test-thread-001',
      },
    });

    console.log('Created conversation:');
  } else {
    console.log('Conversation already exists:');
  }

  console.log(conversation);
}

main()
  .catch((error) => {
    console.error('Database error:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
