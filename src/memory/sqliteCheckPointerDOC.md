# SQLite Checkpointer

The SQLite checkpointer provides **persistent conversation memory for LangGraph** by storing graph checkpoints in a local SQLite database.

## Implementation

```ts
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';

export const sqliteCheckpointer =
  SqliteSaver.fromConnString('./data/chatbot.db');
```

## How It Works

```text
LangGraph
    ↓
SqliteSaver
    ↓
data/chatbot.db
    ↓
Conversation Checkpoints
    ↓
Survives Application Restart
```

The checkpointer stores LangGraph state such as conversation messages and checkpoints, allowing the chatbot to continue a conversation using the same `thread_id`.

> **Important:** `chatbot.db` stores LangGraph conversation memory. It does **not** store RAG embeddings. RAG vectors will use a separate database such as `data/rag.db`.

## Setup

### 1. Install the package

```bash
npm install @langchain/langgraph-checkpoint-sqlite
```

### 2. Create the data directory

From the project root:

```bash
mkdir data
```

The application will create the SQLite database:

```text
data/chatbot.db
```

### 3. Create the checkpointer

Create:

```text
src/memory/SqliteCheckpointer.ts
```

```ts
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';

export const sqliteCheckpointer =
  SqliteSaver.fromConnString('./data/chatbot.db');
```

### 4. Add the database to `.gitignore`

```gitignore
data/
```

The SQLite database contains runtime application data and should normally not be committed to Git.

## Usage

Pass the checkpointer when creating your LangGraph:

```ts
const graph = createChatbotGraph(this.chatbotModel, sqliteCheckpointer);
```

The graph can then be invoked with a `thread_id`:

```ts
await graph.invoke(
  {
    messages: [
      {
        role: 'human',
        content: message,
      },
    ],
  },
  {
    configurable: {
      thread_id: 'conversation-001',
    },
  },
);
```

### Thread ID

The `thread_id` identifies a conversation.

For example:

```text
conversation-001
    ↓
Message 1
    ↓
Message 2
    ↓
Message 3
```

Using the same `thread_id` allows LangGraph to retrieve the corresponding conversation state.

Using a different `thread_id` creates a separate conversation.

## Verification

Start the application:

```bash
npm run dev
```

Send a message using the same `thread_id` multiple times.

Then stop and restart the server.

Send another message using the **same `thread_id`**.

If the chatbot can continue the previous conversation, SQLite persistence is working.

## Storage Architecture

Your project now has two different persistence responsibilities:

```text
data/
│
├── chatbot.db
│   └── LangGraph SQLite Checkpointer
│       └── Conversation State
│
└── rag.db
    └── sqlite-vec
        └── RAG Chunks + Embeddings
```

### Summary

| Database     | Technology    | Purpose             |
| ------------ | ------------- | ------------------- |
| `chatbot.db` | `SqliteSaver` | Conversation memory |
| `rag.db`     | `sqlite-vec`  | RAG vector storage  |

This separation keeps **conversation memory** and **knowledge retrieval** independent while allowing both to use SQLite.
