import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { AiProvider } from "./ai-provider";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GeminiProvider implements AiProvider {
    constructor(private readonly config: ConfigService) {}

    async generateActions(prompt: string, systemPrompt: string): Promise<string> {
        const apiKey = this.config.getOrThrow<string>('AI_API_KEY');
        const model = this.config.get<string>('AI_MODEL', 'gemini-3.6-flash');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
                }),
            },
        );

        if (!response.ok) {
            throw new InternalServerErrorException(`AI provider error: ${await response.text()}`);
        }

        const body = await response.json();
        const content = body?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof content !== 'string') {
            throw new InternalServerErrorException('AI provider mengembalikan response kosong');
        }
        return content;
    }
}