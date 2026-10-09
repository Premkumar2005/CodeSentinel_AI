# CodeSentinel AI 

**Catch the Bug. Crack the Code.**

CodeSentinel AI is a web-based application that inspects source code, identifies potential errors and quality issues, explains problems using AI, and suggests corrections and optimizations. 

## Features
- **Multi-Language Support**: Supports Python, JavaScript, Java, and C++.
- **Static Analysis**: Uses `ruff` for fast and reliable Python linting and static analysis.
- **AI-Powered Code Review**: Provides intelligent explanations, fixes, and complexity estimates.
- **Tailored Analysis**: Choose what the AI should focus on (e.g., Performance, Security, Readability).
- **History Tracking**: Keeps a local SQLite record of past code inspections.
- **Downloadable Reports**: Export your analysis as a Markdown file.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Monaco Editor, Lucide Icons
- **Backend**: Python, FastAPI, SQLite
- **Static Analysis**: Ruff

## Getting Started

### 1. Backend Setup (FastAPI)
Navigate to the `backend` directory and set up a virtual environment:
```bash
cd backend
python -m venv .venv

# Activate the virtual environment:
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# Start the backend server:
uvicorn main:app --reload
```
The API will run on `http://127.0.0.1:8000`.

### 2. Frontend Setup (React/Vite)
Open a new terminal, navigate to the `frontend` directory, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`. Open this URL in your browser to start using CodeSentinel AI!

## Database
The backend uses a local SQLite database (`history.db`) to store past analysis records. This file is automatically created on first run and is ignored by Git to keep your history private.
