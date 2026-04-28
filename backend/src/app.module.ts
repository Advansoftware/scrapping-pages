import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CrawlerModule } from './crawler/crawler.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { CrawlerConfig } from './crawler/entities/crawler-config.entity';
import { ScrapeJob } from './crawler/entities/scrape-job.entity';
import { ApiToken } from './auth/entities/api-token.entity';
import { User } from './users/entities/user.entity';
import { UserAiConfig } from './users/entities/user-ai-config.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'user',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'crawler_db',
      entities: [User, UserAiConfig, ApiToken, CrawlerConfig, ScrapeJob],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    CrawlerModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
