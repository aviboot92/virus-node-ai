import { DatabaseSync } from 'node:sqlite';
import * as sqliteVec from 'sqlite-vec';

const db = new DatabaseSync('./data/rag.db', {
  allowExtension: true,
});

// Load sqlite-vec
sqliteVec.load(db);

// Verify sqlite-vec
const version = db.prepare('SELECT vec_version() AS version').get();

console.log('sqlite-vec version:', version);

// Create vector table
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS test_vectors
  USING vec0(
    embedding float[3]
  );
`);

// Insert vector
db.prepare(
  `
  INSERT INTO test_vectors(embedding)
  VALUES (?)
`,
).run(JSON.stringify([1, 0, 0]));

// Search for the nearest vector
const results = db
  .prepare(
    `
    SELECT
      rowid,
      distance
    FROM test_vectors
    WHERE embedding MATCH ?
      AND k = 1
  `,
  )
  .all(JSON.stringify([1, 0, 0]));

console.log('Search results:', results);

db.close();
