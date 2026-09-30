import { askRag } from '../rag.js';

console.log('1. Starting RAG test...');

const content = `
My dog is a Labrador.
He is two years old.
He loves playing with balls.
He needs daily exercise.
`;

console.log('2. Calling RAG...');

const answer = await askRag('How old is the dog?', content);

console.log('3. Answer received:');
console.log(answer);
