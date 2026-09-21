import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";



const WINDOW_SECONDS = 60;
const MAX_REQUEST_PER_WINDOW = 10;

@Injectable()
export class AiRateLimitGuard implements CanActivate {
    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.sub ?? request.user?.id;
        const key = `ai-command:rate-limit:${userId}`;

        try {
            const count = await this.redis.incr(key);
            if (count === 1) {
                await this.redis.expire(key, WINDOW_SECONDS);
            }

            if (count > MAX_REQUEST_PER_WINDOW) {
                throw new HttpException(
                    `Terlalu banyak permintaan AI command, coba lagi dalam ${WINDOW_SECONDS} detil`,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            return true;
        }

        return true;
    }
}