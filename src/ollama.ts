import * as vscode from 'vscode'
import fetch from 'node-fetch'
import { CommitItem } from './git'

export async function generateTasks(commits: CommitItem[]) {
    const config = vscode.workspace.getConfiguration('aiDailyTasks')
    const model = config.get<string>('model', 'qwen2.5:3b')

    const prompt = buildPrompt(commits)

    const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            format: "json",
            messages: [{ role: "user", content: prompt }],
            stream: false
        })
    })

    if (!res.ok) throw new Error(`Ollama error: HTTP ${res.status}`)

    const data = await res.json()

    if (!data.message?.content)
        throw new Error("Ollama returned an empty message")

    let parsed
    try {
        parsed = JSON.parse(data.message.content)
    } catch (e) {
        throw new Error("Model returned invalid JSON: " + e)
    }

    return {
        summary: parsed.summary || "",
        tasksCompleted: parsed.tasksCompleted || [],
        nextSteps: parsed.nextSteps || []
    }
}

/* -------------------------------------------------------
   UNIVERSAL PROJECT DETECTION PROMPT (Supports ALL Domains)
--------------------------------------------------------*/
function buildPrompt(commits: CommitItem[]) {
    let commitText = ""

    for (const c of commits.slice(0, 40)) {
        commitText += `
COMMIT: ${c.hash}
SUBJECT: ${c.subject || "(empty subject)"}
BODY: ${c.body || "(empty body)"}
FILES: ${c.files?.join(", ") || "(no files)"}
---
`
    }

    return `
You are an expert engineer across ALL domains: backend, frontend, DevOps, mobile, AI/ML, data engineering, and cloud infrastructure.

### 🎯 Your task:
Analyze the commits and infer the REAL project type automatically, then generate accurate tasks.

### 🔍 How to detect the project:
Use filenames, file extensions, folder names, and commit patterns.

Examples:
- **NestJS** → files contain module.ts, controller.ts, service.ts, dto.ts  
- **Express** → routes/*.js, controllers/*.js  
- **React/Next.js** → .jsx, .tsx, components/, pages/  
- **DevOps** → Dockerfile, docker-compose.yaml, terraform/, .github/workflows  
- **AI/ML** → .ipynb, model.py, train.py  
- **Go backend** → *.go with main.go  
- **Java backend** → *.java with Spring annotations  
- **Flutter** → lib/*.dart  
- **Python backend** → app.py, main.py, Django folders  

### 🚫 Avoid Wrong Assumptions:
- NEVER infer frontend if there are no frontend files.
- NEVER infer backend if only ML code exists.
- NEVER invent technology not present in the repo.

### ✔ REQUIRED OUTPUT (JSON ONLY)
You MUST return valid JSON in EXACTLY this format:

{
  "tasksCompleted": ["task 1", "task 2"],
  "nextSteps": ["step 1", "step 2"],
  "summary": "2–3 sentence summary of the actual work done"
}

### 🧠 Task Generation Rules:
- Tasks MUST be specific to the real domain.
- Tasks MUST reference real filenames, modules, or components.
- Tasks MUST be actionable and meaningful.
- Next steps MUST be highly relevant to the detected domain.
- Summary MUST reflect the TRUE nature of the repository.

### ⭐ Special Handling for NestJS:
If NestJS patterns like:
- module.ts
- controller.ts
- service.ts
- guard.ts
- provider.ts
- dto.ts  
are present, generate tasks such as:
- "Created new NestJS module ..."
- "Implemented controller endpoints ..."
- "Added DTO validation ..."
- "Refactored service dependency injection ..."

### 📦 HERE ARE THE COMMITS:
${commitText}
`
}
