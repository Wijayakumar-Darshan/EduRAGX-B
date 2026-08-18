#!/usr/bin/env bash
set -e
if [ -d "venv" ]; then source venv/bin/activate; fi
if ! curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "❌ Ollama not running. Run: ollama serve"; exit 1
fi
for model in "llama3.2:1b" "nomic-embed-text"; do
  if ! ollama list 2>/dev/null | grep -q "$model"; then
    echo "Pulling $model..."; ollama pull "$model"
  fi
done
uvicorn main:app --host 0.0.0.0 --port "${RAG_SERVICE_PORT:-8000}" --timeout-keep-alive 600 --reload
