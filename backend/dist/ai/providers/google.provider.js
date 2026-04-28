"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const ai_prompts_1 = require("../../common/ai-prompts");
class GoogleProvider {
    constructor(apiKey, model) {
        this.model = model;
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async generateSelectors(html) {
        const genModel = this.client.getGenerativeModel({
            model: this.model,
            systemInstruction: ai_prompts_1.SCRAPER_SYSTEM_PROMPT,
        });
        const result = await genModel.generateContent((0, ai_prompts_1.buildGeneratePrompt)(html));
        const raw = result.response.text();
        return (0, ai_prompts_1.cleanJsonResponse)(raw);
    }
    async updateSelectorsAfterFailure(html, previous, failed) {
        const genModel = this.client.getGenerativeModel({
            model: this.model,
            systemInstruction: ai_prompts_1.SCRAPER_SYSTEM_PROMPT,
        });
        const result = await genModel.generateContent((0, ai_prompts_1.buildUpdatePrompt)(html, previous, failed));
        const raw = result.response.text();
        return (0, ai_prompts_1.cleanJsonResponse)(raw);
    }
}
exports.GoogleProvider = GoogleProvider;
//# sourceMappingURL=google.provider.js.map