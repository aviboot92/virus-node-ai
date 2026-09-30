import { splitDocument } from './documents/loader.js';
import { createVectorStore } from './vectorstore/vectorstore.js';

const text = `
My dog is a Labrador.
He is two years old.
He loves playing with balls.
He needs daily exercise.
He eats twice a day.
He is very friendly with people.
`;

const documents = await splitDocument(text);

const vectorStore = await createVectorStore(documents);

const results = await vectorStore.similaritySearch('How old is the dog?', 2);

results.forEach((doc, index) => {
  console.log(`\n--- Result ${index + 1} ---`);
  console.log(doc.pageContent);
});
