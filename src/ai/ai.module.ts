import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AiController } from "./ai.controller";
import { OpenAiProvider } from "./providers/openai.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { AI_PROVIDER } from "./providers/ai-provider";
import { AiService } from "./ai.service";
import { PassportModule } from "@nestjs/passport";

@Module({
    imports: [ConfigModule, AuditLogsModule, PassportModule],
    controllers: [AiController],
    providers: [
        OpenAiProvider,
        GeminiProvider,
        {
            provide: AI_PROVIDER,
            inject: [ConfigService, OpenAiProvider, GeminiProvider],
            useFactory: (config: ConfigService, openAi: OpenAiProvider, gemini: GeminiProvider) =>
                config.get<string>('AI_PROVIDER', 'openai') === 'gemini' ? gemini : openAi,
        },
        AiService,
    ],
})
export class AiModule {}