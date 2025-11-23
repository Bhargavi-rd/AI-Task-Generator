import { Module } from '@nestjs/common';
import { GitService } from './git.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [GitService],
  exports: [GitService],
})
export class GitModule {}
