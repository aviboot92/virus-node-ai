import { retrieveContext } from '../retriever.js';

const context = await retrieveContext('How old is the dog?');

console.log('\nRetrieved context:\n');
console.log(context);
