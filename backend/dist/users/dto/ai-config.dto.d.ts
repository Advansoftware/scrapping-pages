import { AiProviderType } from '../entities/user-ai-config.entity';
export declare class SetAiConfigDto {
    provider: AiProviderType;
    model: string;
    apiKey: string;
    baseUrl?: string;
}
export declare class AiConfigResponseDto {
    id: number;
    provider: AiProviderType;
    model: string;
    maskedApiKey: string | null;
    baseUrl: string | null;
    isConfigured: boolean;
    updatedAt: Date;
}
