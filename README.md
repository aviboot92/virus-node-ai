# virusAI-BOT

Node.js + TypeScript conversational AI chatbot built with **LangGraph, Ollama, and Llama 3.2**.

The project is designed as the foundation for a future AI platform that will evolve from a conversational chatbot into a **RAG system, tool-enabled agent, and eventually a Codebase AI Agent** capable of understanding and analyzing software repositories.

---

# Project Status

## Current Phase

**Phase 1 — Chatbot Foundation: COMPLETE**

Implemented:

- Node.js + TypeScript backend
- Express API
- LangGraph state management
- Ollama integration
- Llama 3.2
- Thread-based conversations
- Ephemeral memory
- SQLite persistent memory
- PostgreSQL persistent memory
- Prisma
- API request validation
- Multiple memory modes
- SQLite as the default persistence mode
- Optional PostgreSQL persistence
- Graceful PostgreSQL-unavailable handling
- Structured API error response for unavailable PostgreSQL

## Not Implemented Yet

The following are planned but are **not part of the current implementation**:

- RAG
- Embeddings
- Vector search
- Document ingestion
- AI tools
- Autonomous agents
- Codebase scanning
- GitHub repository analysis
- Code understanding
- NPM package distribution

# Quick Start

Get the chatbot running with **SQLite** in a few steps. PostgreSQL is optional.

### 1. Clone and install

```bash
git clone <repository-url>
cd virusAI-BOT
npm install
```

### 2. Start Ollama

Make sure Ollama is running and download the model:

```bash
ollama pull llama3.2
```

### 3. Start the application

```bash
npm run dev
```

SQLite is the default persistence provider, so **PostgreSQL is not required**.

### 4. Test the API

Send a `POST` request to:

```text
http://localhost:3000/chat
```

Example:

```json
{
  "message": "Hello, my name is Avinash",
  "threadId": "quickstart-001"
}
```

Because `memoryMode` is omitted, the request uses **SQLite automatically**.

### 5. Test memory

Send:

```json
{
  "message": "What is my name?",
  "threadId": "quickstart-001"
}
```

The chatbot should remember the previous message.

### 6. Build the project

```bash
npm run build
```

### Optional: PostgreSQL

If you want PostgreSQL persistence:

```json
{
  "message": "Hello",
  "threadId": "postgres-001",
  "memoryMode": "postgres"
}
```

PostgreSQL must be installed, running, and configured before using this mode.

If PostgreSQL is unavailable, the API returns `503 Service Unavailable` and suggests using SQLite.

---

# Architecture

## High-Level Architecture

```text
                         Client
                           |
                           | HTTP
                           v
                    +--------------+
                    |   Express    |
                    |     API      |
                    +------+-------+
                           |
                           | POST /chat
                           v
                    +--------------+
                    | VirusChatbot |
                    +------+-------+
                           |
                           v
                    +--------------+
                    |  LangGraph   |
                    | State Graph  |
                    +------+-------+
                           |
                           v
                    +--------------+
                    |  ChatOllama  |
                    |  Llama 3.2   |
                    +--------------+
                           |
                           v
                    +--------------+
                    | Memory State |
                    +------+-------+
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
        MemorySaver     SQLite      PostgreSQL
        ephemeral       persistent   optional
```

---

# Request Flow

```text
HTTP Request
     |
     v
POST /chat
     |
     v
Chat Router
     |
     | validation
     v
VirusChatbot.chat()
     |
     v
getGraph(memoryMode)
     |
     +---- ephemeral ----> MemorySaver
     |
     +---- sqlite -------> SqliteSaver
     |
     +---- postgres ------> PostgreSQL Checkpointer
                                |
                                +-- available
                                |      |
                                |      v
                                |   Continue
                                |
                                +-- unavailable
                                       |
                                       v
                                  HTTP 503
                                       |
                                       v
                              Use SQLite instead
     |
     v
LangGraph
     |
     v
ChatOllama
     |
     v
Llama 3.2
     |
     v
AI response
     |
     v
API response
```

---

# Core Design

The chatbot is divided into clear layers:

```text
API Layer
   |
   v
Chatbot Layer
   |
   v
LangGraph Layer
   |
   v
LLM Layer
   |
   v
Persistence Layer
```

The chatbot should not directly depend on a specific persistence implementation.

Persistence is selected through `MemoryMode`.

---

# Memory Architecture

The project supports three memory modes:

```text
MemoryMode
    |
    +-- ephemeral
    |      |
    |      +-- MemorySaver
    |
    +-- sqlite
    |      |
    |      +-- SqliteSaver
    |
    +-- postgres
           |
           +-- PostgreSQL Checkpointer
```

## Memory Selection

| Mode        | Persistence | Default | PostgreSQL Required |
| ----------- | ----------- | ------: | ------------------: |
| `ephemeral` | No          |      No |                  No |
| `sqlite`    | Yes         | **Yes** |                  No |
| `postgres`  | Yes         |      No |             **Yes** |

---

# 1. Ephemeral Memory

Uses:

```text
MemorySaver
```

Characteristics:

- Stored in application memory
- Fast
- No database required
- Lost when the Node.js process restarts
- Useful for development and temporary conversations

---

# 2. SQLite Persistence

Uses:

```text
SqliteSaver
```

SQLite is the **default persistence mode**.

Characteristics:

- Persistent
- No database server required
- Stored in a local SQLite database file
- Simple setup
- Useful for local development
- Suitable for lightweight/single-instance deployments
- Works without PostgreSQL

Default database:

```text
data/chatbot.db
```

The application creates/uses the SQLite database automatically.

## SQLite Git Rule

The SQLite database should not be committed.

Recommended `.gitignore`:

```gitignore
data/
```

SQLite is not intended to replace PostgreSQL for highly concurrent, horizontally scaled production workloads.

---

# 3. PostgreSQL Persistence

PostgreSQL provides an alternative persistent memory backend.

Characteristics:

- Persistent
- Server-based database
- Suitable for multi-user applications
- Suitable for scalable deployments
- Integrated with Prisma
- Can later support PostgreSQL-based RAG/vector storage

## PostgreSQL Is Optional

PostgreSQL is **not required to start the application**.

The application starts with:

```text
SQLite
```

as the default persistence provider.

PostgreSQL is only initialized when the user explicitly selects:

```text
memoryMode = "postgres"
```

Therefore:

```text
No PostgreSQL installed
        |
        v
npm run dev
        |
        v
Application starts normally
        |
        v
SQLite works
```

---

# PostgreSQL Unavailable Behavior

If a user explicitly selects:

```json
{
  "memoryMode": "postgres"
}
```

but PostgreSQL is unavailable, the application must **not crash**.

The chatbot catches the PostgreSQL failure and returns a controlled error.

Expected HTTP status:

```text
503 Service Unavailable
```

Example response:

```json
{
  "error": "PostgreSQL is unavailable",
  "message": "Please install and start PostgreSQL, or use SQLite instead.",
  "suggestedMemoryMode": "sqlite"
}
```

This allows the client application to gracefully inform the user and switch to SQLite.

---

# Thread ID

`threadId` identifies a conversation state in LangGraph.

Example:

```text
threadId = "conversation-001"
```

Messages using the same `threadId` belong to the same conversation state.

```text
threadId: conversation-001

User: My name is Avinash
AI: Nice to meet you.

User: What is my name?
AI: Your name is Avinash.
```

A different thread creates an independent conversation:

```text
threadId: conversation-002
```

The second thread does not share the first thread's LangGraph state.

> **Important:** `threadId` is a conversation identifier, not a database user ID.

---

# LangGraph Architecture

The current graph is intentionally simple:

```text
START
  |
  v
chatbot
  |
  v
END
```

The current implementation deliberately keeps the graph simple because RAG, tools, and agent behavior are planned for later phases.

---

# State Management

The graph uses:

```ts
StateSchema;
```

with:

```ts
MessagesValue;
```

Conceptually:

```ts
const chatbotState = new StateSchema({
  messages: MessagesValue,
});
```

The chatbot node invokes the model:

```ts
const modelResponse = await model.invoke(state.messages);
```

and returns a state update:

```ts
return {
  messages: [modelResponse],
};
```

`MessagesValue` handles the message-state reduction.

---

# VirusChatbot

`VirusChatbot` is the main application-level abstraction around LangGraph.

Responsibilities:

1. Initialize the LLM.
2. Initialize ephemeral memory.
3. Initialize SQLite persistence.
4. Lazily initialize PostgreSQL when requested.
5. Select the graph based on `MemoryMode`.
6. Invoke the graph.
7. Pass `thread_id`.
8. Normalize the model response.
9. Handle PostgreSQL availability errors.

Current structure:

```text
VirusChatbot
    |
    +-- chatbotModel
    |
    +-- ephemeralGraph
    |
    +-- sqliteGraph
    |
    +-- postgreGraph
    |
    +-- getGraph()
    |
    +-- chat()
```

`postgreGraph` is intentionally optional/lazy.

This means the application does not require PostgreSQL just to start.

---

# MemoryMode

Current type:

```ts
export type MemoryMode = 'ephemeral' | 'sqlite' | 'postgres';
```

SQLite is the default.

Do not use the old generic:

```text
persistent
```

mode.

Both SQLite and PostgreSQL are persistent, so they are explicitly named.

---

# Technology Stack

| Technology     | Purpose                         |
| -------------- | ------------------------------- |
| Node.js        | Runtime                         |
| TypeScript     | Application language            |
| Express        | HTTP API                        |
| LangGraph      | State graph and execution       |
| LangChain Core | Message abstractions            |
| ChatOllama     | LLM integration                 |
| Ollama         | Local model runtime             |
| Llama 3.2      | Current LLM                     |
| SQLite         | Default persistent memory       |
| PostgreSQL     | Optional persistent memory      |
| Prisma         | PostgreSQL ORM/database tooling |
| Postman        | API testing                     |

---

# Project Structure

```text
virusAI-BOT/
│
├── data/
│   └── chatbot.db
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   │
│   ├── chatbot/
│   │   ├── VirusChatbot.ts
│   │   └── chatbot.graph.ts
│   │
│   ├── database/
│   │   ├── prisma.ts
│   │   └── test-db.ts
│   │
│   ├── memory/
│   │   ├── PostgresCheckpointer.ts
│   │   └── SqliteCheckpointer.ts
│   │
│   ├── routes/
│   │   └── chat.routes.ts
│   │
│   ├── types/
│   │   ├── api.ts
│   │   └── chatbot.ts
│   │
│   └── server.ts
│
├── generated/
│   └── prisma/
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts
└── README.md
```

The exact structure may evolve, but the architectural responsibilities should remain separated.

---

# Important File Responsibilities

## `VirusChatbot.ts`

Application-level chatbot abstraction.

Responsible for:

- Model initialization
- Graph initialization
- Memory selection
- PostgreSQL lazy initialization
- Chat invocation
- Response normalization
- Persistence error handling

---

## `chatbot.graph.ts`

Defines the LangGraph workflow.

Current graph:

```text
START -> chatbot -> END
```

This file should contain graph/state concerns rather than HTTP/API logic.

---

## `SqliteCheckpointer.ts`

Provides SQLite-backed LangGraph persistence.

---

## `PostgresCheckpointer.ts`

Provides PostgreSQL-backed LangGraph persistence.

PostgreSQL should remain optional from the application's startup perspective.

---

## `chat.routes.ts`

Responsible for:

- HTTP request handling
- Request validation
- Calling `VirusChatbot`
- HTTP response formatting
- HTTP error handling
- PostgreSQL unavailable response

It should not contain LLM orchestration logic.

---

## `api.ts`

Defines API request/response contracts.

Example:

```ts
export interface ChatRequest {
  message: string;
  threadId: string;
  memoryMode: MemoryMode;
}

export interface ChatResponse {
  reply: string;
  threadId: string;
  memoryMode: MemoryMode;
}
```

---

# Prerequisites

Required:

- Node.js
- npm
- Ollama

PostgreSQL is **optional**.

You only need PostgreSQL if you want to use:

```text
memoryMode = "postgres"
```

---

# Ollama Setup

Install Ollama and pull the current model:

```bash
ollama pull llama3.2
```

Verify:

```bash
ollama list
```

The application currently uses:

```text
llama3.2
```

with:

```text
temperature = 0
```

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
```

Enter the project:

```bash
cd virusAI-BOT
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create:

```text
.env
```

PostgreSQL configuration is required only if PostgreSQL persistence is going to be used.

Example:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/virus_ai_bot"
```

Do not commit `.env`.

SQLite does not require a database connection string.

---

# Prisma Setup

Prisma is currently used for PostgreSQL-related database functionality.

Generate Prisma Client:

```bash
npx prisma generate
```

Run development migrations:

```bash
npx prisma migrate dev
```

Commit Prisma migrations to Git.

---

# Git Rules

Commit:

```text
prisma/schema.prisma
prisma/migrations/
prisma.config.ts
package.json
package-lock.json
README.md
```

Do not commit:

```text
.env
data/
node_modules/
dist/
```

---

# Running the Application

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Production:

```bash
npm start
```

The application can start with SQLite even when PostgreSQL is not installed or running.

---

# API

## POST `/chat`

Creates or continues a conversation.

### Request

```json
{
  "message": "My name is Avinash",
  "threadId": "conversation-001",
  "memoryMode": "sqlite"
}
```

### Supported Memory Modes

```text
ephemeral
sqlite
postgres
```

---

# SQLite Default

If `memoryMode` is omitted:

```json
{
  "message": "Hello",
  "threadId": "conversation-001"
}
```

the application uses:

```text
SQLite
```

automatically.

Equivalent:

```json
{
  "message": "Hello",
  "threadId": "conversation-001",
  "memoryMode": "sqlite"
}
```

---

# API Response

Example:

```json
{
  "reply": "Hello Avinash!",
  "threadId": "conversation-001",
  "memoryMode": "sqlite"
}
```

---

# Validation

The API validates:

- `message`
- `memoryMode`

Valid values:

```text
ephemeral
sqlite
postgres
```

Invalid memory mode:

```json
{
  "message": "Hello",
  "threadId": "conversation-001",
  "memoryMode": "invalid"
}
```

Returns:

```text
400 Bad Request
```

Missing message also returns:

```text
400 Bad Request
```

Unexpected application errors return:

```text
500 Internal Server Error
```

PostgreSQL dependency errors return:

```text
503 Service Unavailable
```

---

# PostgreSQL Error Contract

When:

```json
{
  "memoryMode": "postgres"
}
```

is selected and PostgreSQL is unavailable:

```json
{
  "error": "PostgreSQL is unavailable",
  "message": "Please install and start PostgreSQL, or use SQLite instead.",
  "suggestedMemoryMode": "sqlite"
}
```

The Node.js application remains running.

The client can then retry using:

```json
{
  "memoryMode": "sqlite"
}
```

---

# Testing Memory

## SQLite

Send:

```json
{
  "message": "My name is Avinash",
  "threadId": "sqlite-test-001",
  "memoryMode": "sqlite"
}
```

Then:

```json
{
  "message": "What is my name?",
  "threadId": "sqlite-test-001",
  "memoryMode": "sqlite"
}
```

The chatbot should remember the previous message.

Restart the application and repeat the second request.

The conversation should still exist.

---

# PostgreSQL

If PostgreSQL is available:

```json
{
  "message": "My name is Avinash",
  "threadId": "postgres-test-001",
  "memoryMode": "postgres"
}
```

Restart the application and verify that the same thread still contains its previous state.

---

# PostgreSQL Without PostgreSQL Installed

The application should still start:

```bash
npm run dev
```

because SQLite is the default.

If the user explicitly selects PostgreSQL:

```json
{
  "message": "Hello",
  "threadId": "postgres-test-001",
  "memoryMode": "postgres"
}
```

the API should return:

```text
503 Service Unavailable
```

with a suggestion to use SQLite.

The application itself should remain running.

---

# Ephemeral

Send:

```json
{
  "message": "My name is Avinash",
  "threadId": "ephemeral-test-001",
  "memoryMode": "ephemeral"
}
```

The conversation should survive while the application is running.

After restarting the application, the in-memory state should be lost.

---

# Thread Isolation Test

Thread A:

```text
thread-a
```

Thread B:

```text
thread-b
```

Messages from Thread A must not appear in Thread B.

This behavior is fundamental to the chatbot architecture.

---

# Persistence Comparison

| Feature                | Ephemeral | SQLite             | PostgreSQL |
| ---------------------- | --------- | ------------------ | ---------- |
| Persistent             | No        | Yes                | Yes        |
| Survives restart       | No        | Yes                | Yes        |
| Database server        | No        | No                 | Yes        |
| PostgreSQL required    | No        | No                 | Yes        |
| Lightweight            | Yes       | Yes                | No         |
| Multi-user scalability | Limited   | Limited            | Yes        |
| Default                | No        | **Yes**            | No         |
| Production SaaS        | No        | Workload-dependent | Yes        |

---

# Design Principles

## 1. Chatbot First

The current project intentionally focuses on building a reliable chatbot foundation before introducing advanced AI functionality.

Do not add RAG or Agent behavior directly into the current chatbot unless the architecture is deliberately extended.

---

## 2. Separation of Concerns

Keep these responsibilities separate:

```text
HTTP
 |
 +-- routes

Chatbot
 |
 +-- VirusChatbot

Graph
 |
 +-- chatbot.graph

Memory
 |
 +-- SQLite
 +-- PostgreSQL
 +-- MemorySaver

Database
 |
 +-- Prisma
```

---

## 3. Persistence Must Remain Replaceable

The chatbot should not contain PostgreSQL-specific logic in its core conversation flow.

Persistence is selected through `MemoryMode`.

---

## 4. PostgreSQL Must Remain Optional

The application must be able to start without PostgreSQL.

SQLite is the default.

PostgreSQL should only be initialized when explicitly requested.

---

## 5. Graceful Dependency Failure

An unavailable optional dependency should not crash the application.

For PostgreSQL:

```text
PostgreSQL unavailable
        |
        v
Controlled error
        |
        v
503 response
        |
        v
Suggest SQLite
```

---

## 6. Thread ID Represents Conversation State

Do not use `threadId` as a replacement for authentication or user identity.

Future authentication should introduce a separate user identity model.

---

# AI Development Guidelines

This section exists specifically so future AI coding assistants understand the project.

## Current Source of Truth

The current implementation is a **chatbot**, not an agent.

Do not assume that:

- RAG exists
- Embeddings exist
- Vector search exists
- Tools exist
- Autonomous agents exist
- Code scanning exists
- GitHub integration exists

These are roadmap items.

---

## Current Execution Model

The current LangGraph flow is:

```text
START
  ↓
chatbot
  ↓
END
```

Do not introduce unnecessary graph nodes until a real requirement exists.

---

## Current LLM

The application currently uses:

```text
Ollama
  ↓
Llama 3.2
```

Do not replace the model provider without an explicit architectural decision.

---

## Current Persistence

Three modes exist:

```text
ephemeral
sqlite
postgres
```

SQLite is the default.

PostgreSQL is optional.

---

## Important Naming

Use:

```text
ephemeralGraph
sqliteGraph
postgreGraph
```

Do not use:

```text
persistentGraph
```

because both SQLite and PostgreSQL are persistent.

---

## Important Behavioral Rules

Future changes should preserve:

1. SQLite as the default.
2. PostgreSQL as optional.
3. Application startup without PostgreSQL.
4. Graceful PostgreSQL failure.
5. Thread isolation.
6. Existing API contracts.
7. The current chatbot graph unless there is a deliberate architectural reason to change it.

---

# Roadmap

The project will evolve in stages:

```text
Phase 1
Chatbot Foundation
      |
      v
Phase 2
RAG
      |
      v
Phase 3
Tools
      |
      v
Phase 4
Agent
      |
      v
Phase 5
RAG Agent
      |
      v
Phase 6
Codebase AI Agent
      |
      v
Phase 7
GitHub / Repository Integration
      |
      v
Phase 8
Reusable NPM Package
```

---

# Phase 2 — RAG

Planned architecture:

```text
Documents
    |
    v
Ingestion
    |
    v
Chunking
    |
    v
Embeddings
    |
    v
Vector Store
    |
    v
Retriever
    |
    v
LLM
```

The first RAG implementation should reuse the existing database architecture where practical.

RAG should be introduced only after the current chatbot foundation remains stable.

---

# Phase 3 — Tools

The chatbot will eventually gain tools.

Conceptually:

```text
AI
 |
 +-- Tool
 +-- Tool
 +-- Tool
```

Potential tools may include:

- Project information
- Database queries
- File search
- Repository information
- Documentation lookup

Tools should have explicit contracts and limited responsibilities.

---

# Phase 4 — Agent

The agent will build on the chatbot foundation.

Conceptually:

```text
User
 |
 v
Agent
 |
 +-- LLM
 +-- Memory
 +-- Tools
 +-- RAG
 |
 v
Final response
```

The chatbot remains the conversation-facing layer.

The agent becomes the reasoning/action layer.

---

# Phase 5 — RAG Agent

Intended architecture:

```text
                 AI Application
                      |
              +-------+-------+
              |               |
          Chatbot           Agent
                              |
                 +------------+------------+
                 |            |            |
               Tools        RAG         Memory
                              |
                         Vector Store
```

---

# Phase 6 — Codebase AI Agent

The long-term goal is an AI system capable of understanding software repositories.

Potential architecture:

```text
                    Codebase AI
                         |
                    Codebase Agent
                         |
          +--------------+--------------+
          |              |              |
        Tools           RAG          Memory
          |              |              |
          v              v              v
     File System     Vector Store    Checkpointer
          |
     +----+----+
     |         |
   Local     GitHub
   Source    Source
```

Potential capabilities:

- Understand repository architecture
- Search source code
- Explain modules
- Trace dependencies
- Explain APIs
- Analyze frontend/backend relationships
- Answer architecture questions
- Identify relevant files
- Explain code flows

These capabilities are **not currently implemented**.

---

# Future Repository Sources

The architecture may eventually support:

```text
CodebaseSource
    |
    +-- LocalSource
    +-- GitHubSource
    +-- GitLabSource
    +-- BitbucketSource
```

All sources should eventually produce a common representation:

```ts
interface CodeFile {
  path: string;
  content: string;
  language: string;
}
```

This allows the Codebase Agent to remain independent of the repository provider.

---

# Future NPM Package

The long-term goal is to make the chatbot/agent architecture reusable as an NPM package.

Potential future usage:

```ts
import { VirusAI } from 'virus-ai';

const ai = new VirusAI({
  memory: 'sqlite',
});
```

Potential persistence options:

```text
sqlite
postgres
custom
```

This API is conceptual and is **not implemented yet**.

---

# Production Considerations

Before production deployment, the project should eventually address:

- Authentication
- Authorization
- Rate limiting
- Request validation
- Structured logging
- Error handling
- Secrets management
- Database connection management
- Observability
- Health checks
- Metrics
- Distributed deployment
- Security
- Prompt injection protection
- Model/provider configuration
- RAG security
- Tool authorization
- Repository access permissions

These are future production-hardening areas.

---

# Development Workflow

Recommended development sequence:

```text
1. Implement
      ↓
2. TypeScript build
      ↓
3. Unit/integration test
      ↓
4. API test with Postman
      ↓
5. Verify persistence
      ↓
6. Verify failure scenarios
      ↓
7. Commit
      ↓
8. Continue to next feature
```

Do not introduce several architectural changes simultaneously.

---

# Current Completion Checklist

```text
[x] Node.js project
[x] TypeScript
[x] Express API
[x] Ollama integration
[x] Llama 3.2
[x] LangGraph
[x] StateSchema
[x] MessagesValue
[x] Chatbot graph
[x] Ephemeral memory
[x] SQLite persistence
[x] PostgreSQL persistence
[x] Prisma
[x] Thread-based memory
[x] API validation
[x] Multiple memory modes
[x] SQLite default
[x] PostgreSQL optional
[x] PostgreSQL lazy initialization
[x] Graceful PostgreSQL failure
[x] PostgreSQL 503 API response
[x] Persistence testing

[ ] RAG
[ ] Embeddings
[ ] Vector search
[ ] Tools
[ ] Agent
[ ] Codebase scanner
[ ] GitHub integration
[ ] NPM package
```

---

# Project Direction

The core architectural direction is:

```text
                CURRENT
                   |
                   v
              Chatbot
                   |
                   v
                 RAG
                   |
                   v
                Tools
                   |
                   v
                Agent
                   |
                   v
              RAG Agent
                   |
                   v
          Codebase AI Agent
                   |
                   v
           Reusable Platform
```

The project should evolve incrementally.

The chatbot foundation should remain stable while higher-level AI capabilities are introduced as separate layers.

---

# License

License to be decided.
