import { Module } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { ConfigModule } from '../config/config.module';
import { GitModule } from '../git/git.module';

@Module({
  imports: [ConfigModule, GitModule],
  providers: [OllamaService],
  exports: [OllamaService],
})
export class OllamaModule {}
