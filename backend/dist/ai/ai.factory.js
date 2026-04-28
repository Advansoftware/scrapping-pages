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
exports.AiFactory = void 0;
const common_1 = require("@nestjs/common");
const user_ai_config_entity_1 = require("../users/entities/user-ai-config.entity");
const anthropic_provider_1 = require("./providers/anthropic.provider");
const openai_provider_1 = require("./providers/openai.provider");
const google_provider_1 = require("./providers/google.provider");
const openrouter_provider_1 = require("./providers/openrouter.provider");
const ollama_provider_1 = require("./providers/ollama.provider");
const users_service_1 = require("../users/users.service");
let AiFactory = class AiFactory {
    constructor(usersService) {
        this.usersService = usersService;
    }
    createProvider(config) {
        if (!config || !config.isConfigured) {
            throw new common_1.BadRequestException('Nenhuma configuração de IA encontrada para este usuário. ' +
                'Configure um provider em PUT /users/:id/ai-config.');
        }
        const apiKey = this.usersService.decryptApiKey(config);
        switch (config.provider) {
            case user_ai_config_entity_1.AiProviderType.ANTHROPIC:
                return new anthropic_provider_1.AnthropicProvider(apiKey, config.model);
            case user_ai_config_entity_1.AiProviderType.OPENAI:
                return new openai_provider_1.OpenAiProvider(apiKey, config.model);
            case user_ai_config_entity_1.AiProviderType.GOOGLE:
                return new google_provider_1.GoogleProvider(apiKey, config.model);
            case user_ai_config_entity_1.AiProviderType.OPENROUTER:
                return new openrouter_provider_1.OpenRouterProvider(apiKey, config.model);
            case user_ai_config_entity_1.AiProviderType.OLLAMA:
                return new ollama_provider_1.OllamaProvider(config.model, config.baseUrl ?? 'http://localhost:11434');
            default:
                throw new common_1.BadRequestException(`Provider desconhecido: "${config.provider}". ` +
                    `Valores válidos: ${Object.values(user_ai_config_entity_1.AiProviderType).join(', ')}`);
        }
    }
};
exports.AiFactory = AiFactory;
exports.AiFactory = AiFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], AiFactory);
//# sourceMappingURL=ai.factory.js.map