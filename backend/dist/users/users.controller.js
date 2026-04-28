"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const user_dto_1 = require("./dto/user.dto");
const ai_config_dto_1 = require("./dto/ai-config.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const user_ai_config_entity_1 = require("./entities/user-ai-config.entity");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(dto) {
        const user = await this.usersService.create(dto);
        return this.usersService.toResponse(user);
    }
    async findAll() {
        const users = await this.usersService.findAll();
        return users.map((u) => this.usersService.toResponse(u));
    }
    async getMe(currentUser) {
        const user = await this.usersService.findById(currentUser.id);
        return this.usersService.toResponse(user);
    }
    async findOne(id) {
        const user = await this.usersService.findById(+id);
        return this.usersService.toResponse(user);
    }
    async update(id, dto) {
        const user = await this.usersService.update(+id, dto);
        return this.usersService.toResponse(user);
    }
    async remove(id) {
        await this.usersService.remove(+id);
    }
    getProviderModels() {
        return user_ai_config_entity_1.PROVIDER_MODELS;
    }
    async setAiConfig(id, dto) {
        const config = await this.usersService.setAiConfig(+id, dto);
        return this.toAiConfigResponse(config);
    }
    async getAiConfig(id) {
        const config = await this.usersService.getAiConfig(+id);
        if (!config)
            return null;
        return this.toAiConfigResponse(config);
    }
    async deleteAiConfig(id) {
        await this.usersService.deleteAiConfig(+id);
    }
    async setMyAiConfig(currentUser, dto) {
        const config = await this.usersService.setAiConfig(currentUser.id, dto);
        return this.toAiConfigResponse(config);
    }
    async getMyAiConfig(currentUser) {
        const config = await this.usersService.getAiConfig(currentUser.id);
        if (!config)
            return null;
        return this.toAiConfigResponse(config);
    }
    toAiConfigResponse(config) {
        let maskedApiKey = null;
        if (config.encryptedApiKey) {
            const decrypted = this.usersService.decryptApiKey(config);
            if (decrypted && decrypted.length > 8) {
                maskedApiKey =
                    decrypted.substring(0, 4) +
                        '***..***' +
                        decrypted.substring(decrypted.length - 4);
            }
            else if (decrypted) {
                maskedApiKey = '***';
            }
        }
        return {
            id: config.id,
            provider: config.provider,
            model: config.model,
            maskedApiKey,
            baseUrl: config.baseUrl,
            isConfigured: config.isConfigured,
            updatedAt: config.updatedAt,
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user (admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: user_dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Username already in use' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all users' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [user_dto_1.UserResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the currently authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: user_dto_1.UserResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a user by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, type: user_dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, type: user_dto_1.UserResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 204 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('providers/models'),
    (0, swagger_1.ApiOperation)({
        summary: 'List suggested models per AI provider',
        description: 'Returns a map of provider → available model suggestions. Users can also type any custom model name.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Map of provider to model list',
        schema: {
            example: {
                anthropic: ['claude-opus-4-5', 'claude-3-7-sonnet-20250219'],
                openai: ['gpt-4o', 'gpt-4o-mini'],
                google: ['gemini-2.0-flash-exp', 'gemini-1.5-pro-latest'],
                openrouter: ['openai/gpt-4o', 'anthropic/claude-opus-4-5'],
                ollama: ['llama3.2', 'mistral'],
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProviderModels", null);
__decorate([
    (0, common_1.Put)(':id/ai-config'),
    (0, swagger_1.ApiOperation)({
        summary: 'Set or update AI provider config for a user',
        description: `Configures which AI provider and model this user's API tokens will use.
The \`apiKey\` is encrypted with AES-256-CBC before being stored — it is never returned in responses.

**Provider notes:**
| Provider | apiKey | baseUrl |
|---|---|---|
| \`anthropic\` | Anthropic API key (\`sk-ant-...\`) | Not used |
| \`openai\` | OpenAI API key (\`sk-...\`) | Not used |
| \`google\` | Google AI Studio key | Not used |
| \`openrouter\` | OpenRouter API key (\`sk-or-...\`) | Not used |
| \`ollama\` | Leave empty \`""\` | Required (e.g. \`http://localhost:11434\`) |`,
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, type: ai_config_dto_1.AiConfigResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_config_dto_1.SetAiConfigDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "setAiConfig", null);
__decorate([
    (0, common_1.Get)(':id/ai-config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI config for a user (API key is masked)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, type: ai_config_dto_1.AiConfigResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAiConfig", null);
__decorate([
    (0, common_1.Delete)(':id/ai-config'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove AI config for a user' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 204 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAiConfig", null);
__decorate([
    (0, common_1.Put)('me/ai-config'),
    (0, swagger_1.ApiOperation)({ summary: 'Set my own AI provider config' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: ai_config_dto_1.AiConfigResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_config_dto_1.SetAiConfigDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "setMyAiConfig", null);
__decorate([
    (0, common_1.Get)('me/ai-config'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my own AI provider config (API key is masked)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: ai_config_dto_1.AiConfigResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyAiConfig", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map