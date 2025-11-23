import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get model(): string {
    return this.configService.get<string>('AI_MODEL', 'qwen2.5:3b');
  }

  get ollamaUrl(): string {
    return this.configService.get<string>('OLLAMA_URL', 'http://localhost:11434');
  }

  get gitSince(): string {
    return this.configService.get<string>('GIT_SINCE', '24 hours ago');
  }
}
