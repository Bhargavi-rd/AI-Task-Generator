import { Injectable } from '@nestjs/common';
// Using dynamic import for ESM compatibility
const fetch = (...args: Parameters<typeof import('node-fetch').default>) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
import { ConfigService } from '../config/config.service';
import { GitService, CommitItem } from '../git/git.service';

export interface TaskResult {
  summary: string;
  tasksCompleted: string[];
  nextSteps: string[];
}

@Injectable()
export class OllamaService {
  constructor(
    private configService: ConfigService,
    private gitService: GitService,
  ) {}

  private buildPrompt(commits: CommitItem[]): string {
    let commitText = "";

    for (const c of commits.slice(0, 40)) {
      commitText += `
Commit: ${c.hash}
Author: ${c.author}
Date: ${c.date}
Message: ${c.message}
${c.diff ? 'Diff:' : 'No code changes'}
${c.diff || ''}
`;
    }

    return `Analyze these git commits and generate a summary of work done and tasks completed. 
Also suggest next steps. Follow this JSON format exactly:

{
  "summary": "Brief 2-3 sentence summary of the work done",
  "tasksCompleted": [
    "Task 1 that was completed",
    "Task 2 that was completed"
  ],
  "nextSteps": [
    "Next action item 1",
    "Next action item 2"
  ]
}

Here are the commits to analyze:
${commitText}`;
  }

  async generateTasks(commits: CommitItem[]): Promise<TaskResult> {
    const model = this.configService.model;
    const ollamaUrl = this.configService.ollamaUrl;
    const prompt = this.buildPrompt(commits);

    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        format: 'json',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: HTTP ${res.status}`);
    }

    const data = await res.json() as {
      message?: {
        content: string;
      };
    };

    if (!data.message?.content) {
      throw new Error('Ollama returned an empty message');
    }

    try {
      return JSON.parse(data.message.content) as TaskResult;
    } catch (e) {
      throw new Error('Model returned invalid JSON: ' + e);
    }
  }
}
