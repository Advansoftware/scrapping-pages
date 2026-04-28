import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ApiToken } from './entities/api-token.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private readonly jwtService;
    private readonly tokenRepo;
    private readonly usersService;
    constructor(jwtService: JwtService, tokenRepo: Repository<ApiToken>, usersService: UsersService);
    validateUser(username: string, password: string): Promise<User | null>;
    login(user: User): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            name: string;
        };
    }>;
    resolveApiKeyUser(token: string): Promise<User | null>;
    validateApiToken(token: string): Promise<boolean>;
    createToken(userId: number, name: string, description?: string): Promise<{
        id: number;
        name: string;
        description: string;
        token: string;
        userId: number;
        createdAt: Date;
    }>;
    listTokens(userId?: number): Promise<{
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
    revokeToken(id: number): Promise<{
        message: string;
    }>;
    deleteToken(id: number): Promise<{
        message: string;
    }>;
}
