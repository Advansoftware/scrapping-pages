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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAiConfig = exports.PROVIDER_MODELS = exports.AiProviderType = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const user_entity_1 = require("./user.entity");
var AiProviderType;
(function (AiProviderType) {
    AiProviderType["ANTHROPIC"] = "anthropic";
    AiProviderType["OPENAI"] = "openai";
    AiProviderType["GOOGLE"] = "google";
    AiProviderType["OPENROUTER"] = "openrouter";
    AiProviderType["OLLAMA"] = "ollama";
})(AiProviderType || (exports.AiProviderType = AiProviderType = {}));
exports.PROVIDER_MODELS = {
    [AiProviderType.ANTHROPIC]: [
        'claude-opus-4-5',
        'claude-3-7-sonnet-20250219',
        'claude-3-5-haiku-20241022',
    ],
    [AiProviderType.OPENAI]: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
    ],
    [AiProviderType.GOOGLE]: [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash-latest',
    ],
    [AiProviderType.OPENROUTER]: [
        'openai/gpt-4o',
        'anthropic/claude-opus-4-5',
        'google/gemini-2.0-flash-exp:free',
        'mistralai/mistral-7b-instruct',
        'meta-llama/llama-3.1-8b-instruct:free',
    ],
    [AiProviderType.OLLAMA]: [
        'llama3.2',
        'llama3.1',
        'mistral',
        'codellama',
        'phi3',
    ],
};
let UserAiConfig = class UserAiConfig {
};
exports.UserAiConfig = UserAiConfig;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserAiConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', unique: true }),
    __metadata("design:type", Number)
], UserAiConfig.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.aiConfig),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], UserAiConfig.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AiProviderType, example: AiProviderType.ANTHROPIC }),
    (0, typeorm_1.Column)({ type: 'enum', enum: AiProviderType, default: AiProviderType.ANTHROPIC }),
    __metadata("design:type", String)
], UserAiConfig.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'claude-opus-4-5' }),
    (0, typeorm_1.Column)({ default: 'claude-opus-4-5' }),
    __metadata("design:type", String)
], UserAiConfig.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserAiConfig.prototype, "encryptedApiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'http://localhost:11434', required: false }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserAiConfig.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], UserAiConfig.prototype, "isConfigured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserAiConfig.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserAiConfig.prototype, "updatedAt", void 0);
exports.UserAiConfig = UserAiConfig = __decorate([
    (0, typeorm_1.Entity)('user_ai_configs')
], UserAiConfig);
//# sourceMappingURL=user-ai-config.entity.js.map