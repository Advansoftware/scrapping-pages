"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const openai_1 = require("openai");
const ai_prompts_1 = require("../../common/ai-prompts");
class OllamaProvider {
    constructor(model, baseUrl = 'http://localhost:11434') {
        this.model = model;
        this.client = new openai_1.default({
            apiKey: 'ollama',
            baseURL: `${baseUrl.replace(/\/$/, '')}/v1`,
        });
    }
    async generateSelectors(html) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: ai_prompts_1.SCRAPER_SYSTEM_PROMPT },
                { role: 'user', content: (0, ai_prompts_1.buildGeneratePrompt)(html) },
            ],
            max_tokens: 1024,
        });
        const raw = response.choices[0]?.message?.content ?? '{}';
        return (0, ai_prompts_1.cleanJsonResponse)(raw);
    }
    async updateSelectorsAfterFailure(html, previous, failed) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: ai_prompts_1.SCRAPER_SYSTEM_PROMPT },
                { role: 'user', content: (0, ai_prompts_1.buildUpdatePrompt)(html, previous, failed) },
            ],
            max_tokens: 1024,
        });
        const raw = response.choices[0]?.message?.content ?? '{}';
        return (0, ai_prompts_1.cleanJsonResponse)(raw);
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama.provider.js.map