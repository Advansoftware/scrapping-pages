import OpenAI from 'openai';
import { IAiProvider } from '../interfaces/ai-provider.interface';
import {
  SCRAPER_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildUpdatePrompt,
  cleanJsonResponse,
} from '../../common/ai-prompts';

export class OpenAiProvider implements IAiProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async generateSelectors(html: string): Promise<Record<string, string>> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SCRAPER_SYSTEM_PROMPT },
        { role: 'user', content: buildGeneratePrompt(html) },
      ],
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    return cleanJsonResponse(raw);
  }

  async updateSelectorsAfterFailure(
    html: string,
    previous: Record<string, string>,
    failed: string[],
  ): Promise<Record<string, string>> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SCRAPER_SYSTEM_PROMPT },
        { role: 'user', content: buildUpdatePrompt(html, previous, failed) },
      ],
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    return cleanJsonResponse(raw);
  }
}
