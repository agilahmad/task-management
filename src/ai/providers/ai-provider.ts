export const AI_PROVIDER = 'AI_PROVIDER';

export interface AiProvider {
    generateActions(prompt: string, systemPrompt: string): Promise<string>;
}