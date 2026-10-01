import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export async function splitDocument(content: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 10,
  });
  return splitter.createDocuments([content]);
}
