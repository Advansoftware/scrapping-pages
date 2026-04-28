import { AuthService } from './auth.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        username: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            name: string;
        };
    }>;
    createToken(user: RequestUser, body: {
        name: string;
        description?: string;
    }): Promise<{
        id: number;
        name: string;
        description: string;
        token: string;
        userId: number;
        createdAt: Date;
    }>;
    listTokens(user: RequestUser, userId?: string): Promise<{
        id: number;
        name: string;
        description: string;
        isActive: boolean;
        lastUsedAt: Date;
        createdAt: Date;
        userId: number;
        username: string;
        tokenPreview: string;
    }[]>;
    revokeToken(id: string): Promise<{
        message: string;
    }>;
    deleteToken(id: string): Promise<void>;
}
