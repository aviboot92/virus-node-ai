import { RagService } from '../RagService.js';

const rag = new RagService();

const questions = [
  'How old is Rudra?',
  'What breed is Rudra?',
  'How often does Rudra eat?',
  'Who does Rudra like to play with?',
  'What foods are dangerous for dogs?',
  'What is positive reinforcement?',
  'How should a rescued dog be trained?',
  'What should I know about Great Danes?',
];

async function runTests() {
  for (const question of questions) {
    console.log('\n========================================');
    console.log(`Question: ${question}`);
    console.log('========================================');

    const context = await rag.retrieve(question, 3);

    console.log('\nRetrieved Context:');
    console.log(context);
  }
}

runTests().catch((error) => {
  console.error('RAG test failed:', error);
  process.exit(1);
});
