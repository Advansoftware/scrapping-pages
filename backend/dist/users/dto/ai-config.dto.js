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
exports.AiConfigResponseDto = exports.SetAiConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const user_ai_config_entity_1 = require("../entities/user-ai-config.entity");
class SetAiConfigDto {
}
exports.SetAiConfigDto = SetAiConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: user_ai_config_entity_1.AiProviderType,
        example: user_ai_config_entity_1.AiProviderType.ANTHROPIC,
        description: `AI provider to use. Supported values:
- \`anthropic\` — Claude models via Anthropic API
- \`openai\`    — GPT models via OpenAI API
- \`google\`    — Gemini models via Google AI API
- \`openrouter\`— Any model via OpenRouter (openrouter.ai)
- \`ollama\`    — Local / self-hosted models via Ollama`,
    }),
    __metadata("design:type", String)
], SetAiConfigDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'claude-opus-4-5',
        description: 'Model identifier accepted by the chosen provider.',
    }),
    __metadata("design:type", String)
], SetAiConfigDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'sk-ant-...',
        description: 'API key for the provider. Stored encrypted — never returned in responses.',
    }),
    __metadata("design:type", String)
], SetAiConfigDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'http://localhost:11434',
        description: 'Base URL (required for Ollama; optional for custom OpenAI-compatible endpoints).',
    }),
    __metadata("design:type", String)
], SetAiConfigDto.prototype, "baseUrl", void 0);
class AiConfigResponseDto {
}
exports.AiConfigResponseDto = AiConfigResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], AiConfigResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: user_ai_config_entity_1.AiProviderType, example: user_ai_config_entity_1.AiProviderType.ANTHROPIC }),
    __metadata("design:type", String)
], AiConfigResponseDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'claude-opus-4-5' }),
    __metadata("design:type", String)
], AiConfigResponseDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'sk-ant-***...***',
        description: 'Masked API key — only first/last 4 chars are shown.',
    }),
    __metadata("design:type", String)
], AiConfigResponseDto.prototype, "maskedApiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'http://localhost:11434' }),
    __metadata("design:type", String)
], AiConfigResponseDto.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], AiConfigResponseDto.prototype, "isConfigured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], AiConfigResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=ai-config.dto.js.map