import { IAiProvider } from '../interfaces/ai-provider.interface';
export declare class OpenAiProvider implements IAiProvider {
    private readonly model;
    private readonly client;
    constructor(apiKey: string, model: string);
    generateSelectors(html: string): Promise<Record<string, string>>;
    updateSelectorsAfterFailure(html: string, previous: Record<string, string>, failed: string[]): Promise<Record<string, string>>;
}
