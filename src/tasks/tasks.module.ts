import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { GitModule } from '../git/git.module';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [GitModule, OllamaModule],
  controllers: [TasksController],
})
export class TasksModule {}
