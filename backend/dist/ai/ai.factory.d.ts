import { IAiProvider } from './interfaces/ai-provider.interface';
import { UserAiConfig } from '../users/entities/user-ai-config.entity';
import { UsersService } from '../users/users.service';
export declare class AiFactory {
    private readonly usersService;
    constructor(usersService: UsersService);
    createProvider(config: UserAiConfig): IAiProvider;
}
