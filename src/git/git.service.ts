import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from '../config/config.service';

export interface CommitItem {
  hash: string;
  author: string;
  date: string;
  message: string;
  diff: string;
}

@Injectable()
export class GitService {
  private execAsync = promisify(exec);

  constructor(private configService: ConfigService) {}

  async getCommits(since?: string): Promise<CommitItem[]> {
    const sinceParam = since || this.configService.gitSince;
    const { stdout: logOutput } = await this.execAsync(
      `git log --since="${sinceParam}" --pretty=format:'%H|%an|%ad|%s' --date=iso`,
    );

    const commits: CommitItem[] = [];
    const logLines = logOutput.trim().split('\n').filter(Boolean);

    for (const line of logLines) {
      const [hash, author, date, ...messageParts] = line.split('|');
      const message = messageParts.join('|');
      
      const { stdout: diffOutput } = await this.execAsync(
        `git show --unified=0 ${hash} -- "*.ts" "*.js" "*.json"`,
      );

      commits.push({
        hash,
        author,
        date,
        message,
        diff: diffOutput,
      });
    }

    return commits;
  }

  async getCommitsByRange(from: string, to: string = 'HEAD'): Promise<CommitItem[]> {
    const { stdout: logOutput } = await this.execAsync(
      `git log ${from}..${to} --pretty=format:'%H|%an|%ad|%s' --date=iso`,
    );

    const commits: CommitItem[] = [];
    const logLines = logOutput.trim().split('\n').filter(Boolean);

    for (const line of logLines) {
      const [hash, author, date, ...messageParts] = line.split('|');
      const message = messageParts.join('|');
      
      const { stdout: diffOutput } = await this.execAsync(
        `git show --unified=0 ${hash} -- "*.ts" "*.js" "*.json"`,
      );

      commits.push({
        hash,
        author,
        date,
        message,
        diff: diffOutput,
      });
    }

    return commits;
  }
}
