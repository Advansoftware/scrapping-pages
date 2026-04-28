import { User } from '../../users/entities/user.entity';
export declare class ApiToken {
    id: number;
    name: string;
    description: string | null;
    token: string;
    userId: number;
    user: User;
    isActive: boolean;
    lastUsedAt: Date | null;
    createdAt: Date;
}
