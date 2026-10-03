# Quick Start

## 1. Prerequisites

Fresh clone runtime versions:

- Node.js: **24.20.0**
- npm: **11.19.x**
- Ollama: required for the current local LLM/RAG flow
- Git

Verify:

```powershell
node --version
npm --version
```

Expected:

```text
v24.20.0
11.19.x
```

---

## 2. Clone and install

```powershell
git clone <repository-url>
cd virus-node-ai
npm install
```

Do not copy `node_modules` from another machine. Always run `npm install` after a fresh clone.

---

## 3. SQLite is the default

The application is designed to start with **SQLite as the default persistent memory**.

PostgreSQL is optional.

The local SQLite databases are stored under:

```text
data/
```

The `data/` directory should exist before SQLite opens a database.

If your current code does not create it automatically, create it once:

```powershell
mkdir data
```

The database files under `data/` are local runtime data and should remain ignored by Git.

---

## 4. Environment variables

SQLite mode does **not** require PostgreSQL configuration.

A missing `.env` file should therefore not prevent the application from starting in SQLite mode.

If you use PostgreSQL, create:

```text
.env
```

Example:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/virus_ai
```

Never commit `.env` or real credentials.

---

## 5. PostgreSQL is optional

The architecture supports:

```text
Ephemeral
   │
SQLite  ← default
   │
PostgreSQL ← optional
```

PostgreSQL must **not** be initialized during normal SQLite startup.

In particular, `server.ts` must not unconditionally execute:

```ts
await postgresCheckpointer.setup();
```

PostgreSQL setup should happen only when PostgreSQL memory mode is explicitly requested.

### PostgreSQL requirements

If PostgreSQL mode is selected:

1. PostgreSQL must be installed and running.
2. `DATABASE_URL` must be defined.
3. The database referenced by the URL must already exist.

For the current configuration, the database name is:

```text
virus_ai
```

If the database does not exist, PostgreSQL will report:

```text
database "virus_ai" does not exist
```

Create the database before using PostgreSQL mode.

---

## 6. Ollama

The current chatbot and RAG implementation uses Ollama locally.

The chatbot uses:

```text
llama3.2
```

The RAG embedding flow uses the configured Ollama embedding model (currently `nomic-embed-text`).

Verify Ollama:

```powershell
ollama --version
```

Make sure the required models are available:

```powershell
ollama list
```

If required, pull the models:

```powershell
ollama pull llama3.2
ollama pull nomic-embed-text
```

Ollama must be running when the application needs to generate LLM responses or embeddings.

---

## 7. sqlite-vec

The project uses `sqlite-vec` for SQLite vector search.

The validated local version is:

```text
sqlite-vec 0.1.9
```

The project loads the extension using SQLite extension support.

A working test verified:

```text
sqlite-vec version: v0.1.9
```

If vector initialization fails, first verify that dependencies were installed correctly with:

```powershell
npm install
```

---

## 8. Start the application

Use the development script defined in `package.json`.

For the current project:

```powershell
npm run dev
```

The development server uses:

```text
tsx watch src/server.ts
```

A successful SQLite startup should **not** attempt to connect to PostgreSQL.

---

## 9. RAG flow

The current RAG pipeline is:

```text
knowledge.txt
      │
      ▼
Document loading
      │
      ▼
Chunking
      │
      ▼
Ollama Embeddings
      │
      ▼
SQLite Vector Store
      │
      ▼
Similarity Search
      │
      ▼
Top-K relevant chunks
      │
      ▼
Llama 3.2
      │
      ▼
Answer
```

The current retrieval test uses:

```text
top-k = 3
```

That means the three most relevant chunks are retrieved and supplied to the chatbot.

The chatbot is instructed to answer from the retrieved knowledge and respond with:

```text
I don't have enough information in my knowledge base.
```

when the answer cannot be found in the knowledge base.

---

## 10. Fresh-clone checklist

After cloning the repository on a new machine:

```powershell
git clone <repository-url>
cd virus-node-ai

node --version
npm --version

npm install

mkdir data

ollama list

npm run dev
```

Before starting, confirm:

- [ ] Node.js is 24.20.0
- [ ] npm is 11.19.x
- [ ] `npm install` completed successfully
- [ ] `data/` exists
- [ ] Ollama is installed and running
- [ ] `llama3.2` is available
- [ ] `nomic-embed-text` is available
- [ ] PostgreSQL is **not required** for SQLite mode
- [ ] `.env` is only required for features that need environment configuration

---

# Common Problems

## Error: Cannot open database because the directory does not exist

Example:

```text
TypeError: Cannot open database because the directory does not exist
```

Cause:

The SQLite database path points to a directory that does not exist.

Fix:

```powershell
mkdir data
```

The application should ideally create this directory automatically during initialization.

---

## Error: DATABASE_URL is not defined

Example:

```text
Error: DATABASE_URL is not defined
```

If you are using SQLite, this error means PostgreSQL is being initialized when it should not be.

Check that:

```ts
await postgresCheckpointer.setup();
```

is not being called unconditionally from `server.ts`.

PostgreSQL initialization must be lazy/conditional.

If you intentionally selected PostgreSQL mode, add the correct `DATABASE_URL` to `.env`.

---

## Error: database "virus_ai" does not exist

Example:

```text
database "virus_ai" does not exist
```

Cause:

PostgreSQL is running, but the configured database has not been created.

Fix:

Create the `virus_ai` database, then retry PostgreSQL mode.

Alternatively, use SQLite mode if PostgreSQL is not required.

---

## Error: sqlite-vec extension cannot be loaded

If SQLite reports that extension loading is disabled, the database must be created/configured with extension loading enabled before loading `sqlite-vec`.

The validated setup uses:

```ts
const db = new DatabaseSync('./data/rag.db', {
  allowExtension: true,
});
```

---

## Error: Only integers are allowed for primary key values

When inserting into a `vec0` virtual table, do not manually supply an arbitrary `rowid`.

Use:

```sql
INSERT INTO test_vectors(embedding)
VALUES (?)
```

and let SQLite manage the row identifier.

---

# Runtime Architecture

```text
                     ┌─────────────────┐
                     │   Express API   │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  VirusChatbot   │
                     └───────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
          Ephemeral        SQLite       PostgreSQL
           Memory         Default         Optional
                             │
                             ▼
                       LangGraph
                       Checkpointer

                             │
                             ▼
                         RAG Service
                             │
                             ▼
                     SQLite Vector Store
                         + sqlite-vec
                             │
                             ▼
                    Ollama Embeddings
                             │
                             ▼
                         Llama 3.2
```

---

# Important Development Rule

Keep the default startup path independent of PostgreSQL.

The intended behavior is:

```text
Fresh clone
   │
   ├── npm install
   ├── create data/
   ├── start Ollama
   └── npm run dev
            │
            ▼
       Application starts
            │
            ▼
       SQLite works
```

PostgreSQL should be introduced only when explicitly needed.

This keeps local development simple and makes the project easier to deploy later as both an NPM package and a cloud service.
