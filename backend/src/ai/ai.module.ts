import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiFactory } from './ai.factory';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AiService, AiFactory],
  exports: [AiService, AiFactory],
})
export class AiModule { }
