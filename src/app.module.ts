import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { GitModule } from './git/git.module';
import { OllamaModule } from './ollama/ollama.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule,
    GitModule,
    OllamaModule,
    TasksModule,
  ],
})
export class AppModule {}
