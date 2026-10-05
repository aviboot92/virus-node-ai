import { splitDocument } from '../documents/loader.js';

const text = `
My dog is a Labrador.
He is two years old.
He loves playing with balls.
He needs daily exercise.
He eats twice a day.
He is very friendly with people.
`;

const documents = await splitDocument(text);

documents.forEach((doc, index: number) => {
  console.log(`\n--- Chunk ${index + 1} ---`);
  console.log(doc.pageContent);
});
