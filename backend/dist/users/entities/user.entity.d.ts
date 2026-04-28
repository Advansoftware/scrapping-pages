import { UserAiConfig } from './user-ai-config.entity';
import { ApiToken } from '../../auth/entities/api-token.entity';
export declare class User {
    id: number;
    username: string;
    passwordHash: string;
    name: string;
    isActive: boolean;
    isAdmin: boolean;
    aiConfig: UserAiConfig | null;
    tokens: ApiToken[];
    createdAt: Date;
    updatedAt: Date;
}
