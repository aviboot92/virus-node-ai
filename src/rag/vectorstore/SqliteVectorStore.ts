import { DatabaseSync } from 'node:sqlite';
import * as sqliteVec from 'sqlite-vec';
import { Document } from '@langchain/core/documents';
import type { Embeddings } from '@langchain/core/embeddings';

// Documents
//    ↓
// Embeddings
//    ↓
// SQLite + (===sqlite-vec======)
//    ↓
// Persistent vectors
//    ↓
// Similarity search

// Class SqliteVectorStore

export class SqliteVectorStore {
  private readonly db: DatabaseSync;
  private readonly embeddings: Embeddings;
  private initialized = false;
  private vectorDimension?: number;

  constructor(embeddings: Embeddings, dbPath = './data/rag.db') {
    this.embeddings = embeddings;
    this.db = new DatabaseSync(dbPath, {
      allowExtension: true,
    });
    sqliteVec.load(this.db);
  }

  initialize(): void {
    // If Vector Store is already initialised please don't perform duplicate initialisation
    if (!this.initialized) return;
    // =====Creating "rag_documents" SQL TABLE================
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rag_documents (
        id INTEGER PRIMARY KEY AUTOINCREEMENT,
        vector_rowid INTEGER NOT NULL UNIQUE,
        content TEXT NOT NULL,
        metadata TEXT 
      )
      `);
    this.initialized = true;
  }

  private ensureVectorTable() {}
}

// ============OOPS Test Object instance======
// const sqliteVS = await new SqliteVectorStore();

// console.dir(sqliteVS);
