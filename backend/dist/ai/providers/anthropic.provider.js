"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const sdk_1 = require("@anthropic-ai/sdk");
const ai_prompts_1 = require("../../common/ai-prompts");
class AnthropicProvider {
    constructor(apiKey, model) {
        this.model = model;
        this.client = new sdk_1.default({ apiKey });
    }
    async generateSelectors(html) {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 1024,
            system: ai_prompts_1.SCRAPER_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: (0, ai_prompts_1.buildGeneratePrompt)(html) }],
        });
        const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
        return (0, ai_prompts_1.cleanJsonResponse)(raw);
    }
    async updateSelectorsAfterFailure(html, previous, failed) {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 1024,
            system: ai_prompts_1.SCRAPER_SYSTEM_PROMPT,
            messages: [
                { role: 'user', content: (0, ai_prompts_1.buildUpdatePrompt)(html, previous, failed) },
            ],
        });
        const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
        return (0, ai_prompts_1.cleanJsonResponse)(raw);
    }
}
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=anthropic.provider.js.map