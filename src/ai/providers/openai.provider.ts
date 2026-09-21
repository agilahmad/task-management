import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { AiProvider } from "./ai-provider";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OpenAiProvider implements AiProvider {
    constructor(private readonly config: ConfigService) {}

    async generateActions(prompt: string, systemPrompt: string): Promise<string> {
        const apiKey = this.config.getOrThrow<string>('AI_API_KEY');
        const model = this.config.get<string>('AI_MODEL', 'gpt-4o-mini');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                temperature: 0,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
            }),
        });

        if (!response.ok) {
            throw new InternalServerErrorException(`AI provider error: ${await response.text()}`);
        }

        const body = await response.json();
        const content = body?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
            throw new InternalServerErrorException('AI provide mengembalikan response kosong')
        }
        return content;
    }
}