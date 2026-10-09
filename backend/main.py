import sqlite3
import subprocess
import tempfile
import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CodeSentinel AI API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "history.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            code TEXT,
            language TEXT,
            issues TEXT,
            ai_explanation TEXT,
            corrected_code TEXT,
            complexity TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

class CodeRequest(BaseModel):
    code: str
    language: str = "python"
    analysis_type: str = "default"

class Issue(BaseModel):
    line: int
    code: str
    message: str
    severity: str

class InspectionResponse(BaseModel):
    id: int
    issues: List[Issue]
    ai_explanation: str
    corrected_code: str
    complexity: str

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "CodeSentinel AI backend is running."}

def run_ruff(code: str) -> List[dict]:
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w") as f:
        f.write(code)
        temp_path = f.name
    
    try:
        result = subprocess.run(
            ["ruff", "check", temp_path, "--output-format", "json"],
            capture_output=True,
            text=True
        )
        
        issues = []
        if result.stdout:
            try:
                ruff_output = json.loads(result.stdout)
                for item in ruff_output:
                    issues.append({
                        "line": item.get("location", {}).get("row", 0),
                        "code": item.get("code", "UNKNOWN"),
                        "message": item.get("message", "Unknown error"),
                        "severity": "error" if item.get("code", "").startswith("E") or item.get("code", "").startswith("F") else "warning"
                    })
            except json.JSONDecodeError:
                pass
        return issues
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def generate_ai_explanation(code: str, issues: List[dict], language: str, analysis_type: str) -> tuple[str, str, str]:
    # Placeholder for real LLM API call
    focus = {
        "default": "general bugs and best practices",
        "performance": "time complexity and execution speed optimization",
        "security": "vulnerabilities and secure coding practices",
        "readability": "clean code, naming conventions, and documentation"
    }.get(analysis_type, "general improvements")

    explanation = f"Analyzing {language} code focusing on {focus}.\n\n"
    
    if issues:
        issue_list = "\n".join([f"- Line {i['line']}: {i['message']}" for i in issues])
        explanation += f"Static Analysis found {len(issues)} issue(s):\n{issue_list}\n\n"
        explanation += "AI Suggestion: I recommend addressing these linting errors first to ensure baseline stability."
    else:
        explanation += "Static Analysis passed successfully. The AI review suggests the logic is generally sound but can be enhanced."
        
    corrected = code + f"\n\n/* AI Suggestion: Refactored for better {focus} */"
    if language.lower() == "python":
        corrected = code + f"\n\n# AI Suggestion: Refactored for better {focus}"
        
    complexity = "Time: O(N) | Space: O(1)"
    if analysis_type == "performance":
        complexity = "Optimized Time: O(log N) | Space: O(1)"
        
    return explanation, corrected, complexity

@app.post("/api/inspect", response_model=InspectionResponse)
def inspect_code(request: CodeRequest):
    issues_data = []
    # Only run Ruff for Python
    if request.language.lower() == "python":
        issues_data = run_ruff(request.code)
    
    explanation, corrected, complexity = generate_ai_explanation(
        request.code, issues_data, request.language, request.analysis_type
    )
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    cursor.execute('''
        INSERT INTO inspections (timestamp, code, language, issues, ai_explanation, corrected_code, complexity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (timestamp, request.code, request.language, json.dumps(issues_data), explanation, corrected, complexity))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return InspectionResponse(
        id=record_id,
        issues=[Issue(**i) for i in issues_data],
        ai_explanation=explanation,
        corrected_code=corrected,
        complexity=complexity
    )

@app.get("/api/history")
def get_history():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT id, timestamp, language, issues FROM inspections ORDER BY id DESC LIMIT 50')
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
