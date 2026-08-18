@echo off
if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat
curl -sf http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (echo ❌ Run: ollama serve first & pause & exit /b 1)
ollama list | findstr "llama3.2:1b" >nul 2>&1
if errorlevel 1 (echo Pulling llama3.2:1b... & ollama pull llama3.2:1b)
ollama list | findstr "nomic-embed-text" >nul 2>&1
if errorlevel 1 (echo Pulling nomic-embed-text... & ollama pull nomic-embed-text)
echo.
echo Starting EduRAGX RAG Service on port 8000...
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --timeout-keep-alive 600 --reload
