import Anthropic from '@anthropic-ai/sdk';
import { IAiProvider } from '../interfaces/ai-provider.interface';
import {
  SCRAPER_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildUpdatePrompt,
  cleanJsonResponse,
} from '../../common/ai-prompts';

export class AnthropicProvider implements IAiProvider {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async generateSelectors(html: string): Promise<Record<string, string>> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: SCRAPER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildGeneratePrompt(html) }],
    });

    const raw =
      response.content[0].type === 'text' ? response.content[0].text : '{}';
    return cleanJsonResponse(raw);
  }

  async updateSelectorsAfterFailure(
    html: string,
    previous: Record<string, string>,
    failed: string[],
  ): Promise<Record<string, string>> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: SCRAPER_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUpdatePrompt(html, previous, failed) },
      ],
    });

    const raw =
      response.content[0].type === 'text' ? response.content[0].text : '{}';
    return cleanJsonResponse(raw);
  }
}
