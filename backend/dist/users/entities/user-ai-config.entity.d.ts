import { User } from './user.entity';
export declare enum AiProviderType {
    ANTHROPIC = "anthropic",
    OPENAI = "openai",
    GOOGLE = "google",
    OPENROUTER = "openrouter",
    OLLAMA = "ollama"
}
export declare const PROVIDER_MODELS: Record<AiProviderType, string[]>;
export declare class UserAiConfig {
    id: number;
    userId: number;
    user: User;
    provider: AiProviderType;
    model: string;
    encryptedApiKey: string | null;
    baseUrl: string | null;
    isConfigured: boolean;
    createdAt: Date;
    updatedAt: Date;
}
