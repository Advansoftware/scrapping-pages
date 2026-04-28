import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserAiConfig } from './entities/user-ai-config.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { SetAiConfigDto } from './dto/ai-config.dto';
export declare class UsersService implements OnModuleInit {
    private readonly userRepo;
    private readonly aiConfigRepo;
    private readonly logger;
    constructor(userRepo: Repository<User>, aiConfigRepo: Repository<UserAiConfig>);
    onModuleInit(): Promise<void>;
    create(dto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    validatePassword(user: User, password: string): Promise<boolean>;
    update(id: number, dto: UpdateUserDto): Promise<User>;
    remove(id: number): Promise<void>;
    setAiConfig(userId: number, dto: SetAiConfigDto): Promise<UserAiConfig>;
    getAiConfig(userId: number): Promise<UserAiConfig | null>;
    decryptApiKey(config: UserAiConfig): string | null;
    deleteAiConfig(userId: number): Promise<void>;
    toResponse(user: User): {
        id: number;
        username: string;
        name: string;
        isActive: boolean;
        isAdmin: boolean;
        createdAt: Date;
        hasAiConfig: boolean;
    };
}
