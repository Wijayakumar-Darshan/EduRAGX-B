# EduRAGX — Blockchain-Enhanced Explainable RAG-Based Decision Support System

**100% Ollama-powered. Zero OpenAI dependency. Optimized for 8GB RAM.**

---

## Your exact setup (from your message)

You already have Ollama installed. This project is pre-configured for `llama3.2:1b` — perfect for 8GB RAM.

```bash
ollama pull llama3.2:1b
ollama pull nomic-embed-text
ollama serve
```

Your `rag-service/.env` is already set up:
```dotenv
DATABASE_URL=mysql://root:SRIshanthi789@localhost:3306/eduragx_db
LLM_MODEL=llama3.2:1b
EMBEDDING_MODEL=nomic-embed-text
```

**Update your MySQL password in BOTH `.env` files if it differs:**
- `backend/.env`
- `rag-service/.env`

---

## Setup (5 terminals)

### 1 — Ollama (keep running)
```bash
ollama serve
```

### 2 — Database
```bash
mysql -u root -p -e "CREATE DATABASE eduragx_db CHARACTER SET utf8mb4;"
```

### 3 — Backend
```bash
cd backend
npm install
npx prisma db push
node src/seed.js
npm run dev          # :5000
```

### 4 — RAG Service
```bash
cd rag-service
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
start.bat                      # Windows — auto-pulls models if missing
```
Wait for: `🚀 RAG Service ready — waiting for requests`

### 5 — Frontend
```bash
cd frontend
npm install
npm run dev           # :5173
```

---

## Demo Credentials (password: `password123`)

| Role    | Email                 | Notes                            |
|---------|------------------------|-----------------------------------|
| Admin   | admin@eduragx.com      | Link parents to students here    |
| Teacher | teacher1@eduragx.com   | Teaches Alex — gets AI recommendations |
| Teacher | teacher2@eduragx.com   | Teaches Emma                     |
| Student | student1@eduragx.com   | Alex — gets AI career guidance   |
| Student | student2@eduragx.com   | Emma                             |
| Parent  | parent1@eduragx.com    | James → Alex (auto-linked)       |
| Parent  | parent2@eduragx.com    | Linda → Emma (auto-linked)       |

---

## Why this works on 8GB RAM

| Model | RAM needed | Used here |
|---|---|---|
| `llama3.2:1b` | ~1GB | ✅ Yes |
| `nomic-embed-text` | ~300MB | ✅ Yes |
| `mistral:latest` | ~5GB | ❌ Removed — too heavy |

Total RAM footprint: **~1.5GB** for both models combined, leaving headroom for MySQL, Node, and your OS.

## AI is 100% local — no OpenAI

Every AI call in this project routes through:
```
Node backend → RAG Service (FastAPI) → Ollama (llama3.2:1b)
```
No `OPENAI_API_KEY` exists anywhere in the codebase. Confirmed via `grep -r "openai" backend/` returning zero results.

## Teacher AI Recommendations
`TeacherStudents.jsx` → AI Analysis panel — plain English summary, strengths/weaknesses cards, prioritized action plan. No raw JSON shown.

## Student AI Guidance
`StudentAI.jsx` → Study Chat + Career Guidance tabs — conversational responses, match-percentage career cards. No raw JSON shown.

## Blockchain (bonus — mock mode by default)
Leave `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `BLOCKCHAIN_CONTRACT_ADDRESS` empty in `backend/.env` for zero-setup mock mode. Teacher Year-End Reports can be "anchored" and students can verify PDF authenticity via SHA-256 hash comparison.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| AI times out | Confirm `ollama serve` running + `ollama list` shows `llama3.2:1b` |
| `ECONNRESET` | RAM pressure — close other apps; llama3.2:1b needs only ~1GB but background apps add up |
| Backend crashes on start | Already fixed — all controller functions defined before `module.exports` |
| Parent sees empty dashboard | Admin → Users → Edit parent → select "Link to Child" |
| MySQL connection refused | Check `DATABASE_URL` password matches your MySQL root password in both `.env` files |
