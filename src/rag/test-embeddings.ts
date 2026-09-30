import { embeddings } from './embeddings/embeddings.js';

const vector = await embeddings.embedQuery('My dog loves playing with balls');

console.log('Vector Dimensions', vector.length);
console.log('First 10 values', vector.slice(0, 10));
