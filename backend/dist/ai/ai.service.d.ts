import { AiFactory } from './ai.factory';
import { UserAiConfig } from '../users/entities/user-ai-config.entity';
export declare class AiService {
    private readonly factory;
    constructor(factory: AiFactory);
    generateSelectors(html: string, aiConfig: UserAiConfig): Promise<Record<string, string>>;
    updateSelectorsAfterFailure(html: string, previousSelectors: Record<string, string>, failedFields: string[], aiConfig: UserAiConfig): Promise<Record<string, string>>;
}
