import { Controller, Get, Query } from '@nestjs/common';
import { GitService } from '../git/git.service';
import { OllamaService, TaskResult } from '../ollama/ollama.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly gitService: GitService,
    private readonly ollamaService: OllamaService,
  ) {}

  @Get('generate')
  async generateTasks(
    @Query('since') since?: string,
  ): Promise<TaskResult> {
    const commits = await this.gitService.getCommits(since);
    return this.ollamaService.generateTasks(commits);
  }

  @Get('range')
  async generateTasksByRange(
    @Query('from') from: string,
    @Query('to') to: string = 'HEAD',
  ): Promise<TaskResult> {
    const commits = await this.gitService.getCommitsByRange(from, to);
    return this.ollamaService.generateTasks(commits);
  }
}
