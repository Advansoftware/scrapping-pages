import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider } from '../interfaces/ai-provider.interface';
import {
  SCRAPER_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildUpdatePrompt,
  cleanJsonResponse,
} from '../../common/ai-prompts';

export class GoogleProvider implements IAiProvider {
  private readonly client: GoogleGenerativeAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateSelectors(html: string): Promise<Record<string, string>> {
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: SCRAPER_SYSTEM_PROMPT,
    });

    const result = await genModel.generateContent(buildGeneratePrompt(html));
    const raw = result.response.text();
    return cleanJsonResponse(raw);
  }

  async updateSelectorsAfterFailure(
    html: string,
    previous: Record<string, string>,
    failed: string[],
  ): Promise<Record<string, string>> {
    const genModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: SCRAPER_SYSTEM_PROMPT,
    });

    const result = await genModel.generateContent(
      buildUpdatePrompt(html, previous, failed),
    );
    const raw = result.response.text();
    return cleanJsonResponse(raw);
  }
}
