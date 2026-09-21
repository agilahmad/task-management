import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { config } from "process";
import { AiRateLimitGuard } from "./rate-limit.guard";
import { REDIS_CLIENT } from "./redis.constants";


@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) =>
                new Redis({
                    host: config.get<string>('REDIS_HOST', 'localhost'),
                    port: config.get<number>('REDIS_PORT', 6379),
                    maxRetriesPerRequest: 1,
                    lazyConnect: true,
                }),
        },
        AiRateLimitGuard
    ],
    exports: [REDIS_CLIENT, AiRateLimitGuard],
})
export class RedisModule {}
