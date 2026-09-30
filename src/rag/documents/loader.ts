import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export async function splitDocument(content: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  return splitter.createDocuments([content]);
}
