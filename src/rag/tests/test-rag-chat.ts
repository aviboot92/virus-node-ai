import { RagChatService } from '../RagChatService.js';

const ragChat = new RagChatService();

const questions = [
  'How old is Rudra?',
  'What breed is Rudra?',
  'Who does Rudra like to play with?',
  'What foods are dangerous for dogs?',
  'What is positive reinforcement?',
  'What should I know about Great Danes?',
  'What is Rudra favorite food?',
];

for (const question of questions) {
  console.log('\n========================================');
  console.log(`Question: ${question}`);
  console.log('========================================');

  const answer = await ragChat.ask(question);

  console.log('Answer:');
  console.log(answer);
}
