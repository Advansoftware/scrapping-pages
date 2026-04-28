import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { SetAiConfigDto, AiConfigResponseDto } from './dto/ai-config.dto';
import { RequestUser } from '../common/decorators/current-user.decorator';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto): Promise<{
        id: number;
        username: string;
        name: string;
        isActive: boolean;
        isAdmin: boolean;
        createdAt: Date;
        hasAiConfig: boolean;
    }>;
    findAll(): Promise<{
        id: number;
        username: string;
        name: string;
        isActive: boolean;
        isAdmin: boolean;
        createdAt: Date;
        hasAiConfig: boolean;
    }[]>;
    getMe(currentUser: RequestUser): Promise<{
        id: number;
        username: string;
        name: string;
        isActive: boolean;
        isAdmin: boolean;
        createdAt: Date;
        hasAiConfig: boolean;
    }>;
    findOne(id: string): Promise<{
        id: number;
        username: string;
        name: string;
        isActive: boolean;
        isAdmin: boolean;
        createdAt: Date;
        hasAiConfig: boolean;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: number;
        username: string;
        name: string;
        isActive: boolean;
        isAdmin: boolean;
        createdAt: Date;
        hasAiConfig: boolean;
    }>;
    remove(id: string): Promise<void>;
    getProviderModels(): Record<import("./entities/user-ai-config.entity").AiProviderType, string[]>;
    setAiConfig(id: string, dto: SetAiConfigDto): Promise<AiConfigResponseDto>;
    getAiConfig(id: string): Promise<AiConfigResponseDto>;
    deleteAiConfig(id: string): Promise<void>;
    setMyAiConfig(currentUser: RequestUser, dto: SetAiConfigDto): Promise<AiConfigResponseDto>;
    getMyAiConfig(currentUser: RequestUser): Promise<AiConfigResponseDto>;
    private toAiConfigResponse;
}
