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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const ai_factory_1 = require("./ai.factory");
let AiService = class AiService {
    constructor(factory) {
        this.factory = factory;
    }
    async generateSelectors(html, aiConfig) {
        const provider = this.factory.createProvider(aiConfig);
        return provider.generateSelectors(html);
    }
    async updateSelectorsAfterFailure(html, previousSelectors, failedFields, aiConfig) {
        if (!aiConfig?.isConfigured) {
            throw new common_1.BadRequestException('AI config not found for user');
        }
        const provider = this.factory.createProvider(aiConfig);
        return provider.updateSelectorsAfterFailure(html, previousSelectors, failedFields);
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_factory_1.AiFactory])
], AiService);
//# sourceMappingURL=ai.service.js.map