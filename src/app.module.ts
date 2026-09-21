import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { AiModule } from './ai/ai.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsfilter } from './common/filters/http-exception.filter';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV', 'development') !== 'production'
      }),
    }),
    RedisModule,
    AuthModule,
    UserModule,
    ProjectsModule,
    TasksModule,
    AiModule,
    AuditLogsModule
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsfilter }],
})
export class AppModule {}
