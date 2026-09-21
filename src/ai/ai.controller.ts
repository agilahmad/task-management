import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AiRateLimitGuard } from "../common/redis/rate-limit.guard";
import { AiService } from "./ai.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { AiCommandDto } from "./dto/ai-command.dto";

@UseGuards(JwtAuthGuard, AiRateLimitGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Post('command')
    runCommand(@Body() dto: AiCommandDto, @CurrentUser() user: AuthenticatedUser) {
        return this.aiService.runCommand(dto.prompt, user.id);
    }
}