/**
 * OpenRouter provider — uses the OpenAI-compatible API at openrouter.ai.
 * Supports hundreds of models (OpenAI, Anthropic, Google, Mistral, etc.)
 * with a single API key.
 *
 * @see https://openrouter.ai/docs
 */
import OpenAI from 'openai';
import { IAiProvider } from '../interfaces/ai-provider.interface';
import {
  SCRAPER_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildUpdatePrompt,
  cleanJsonResponse,
} from '../../common/ai-prompts';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterProvider implements IAiProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/crawler-ai',
        'X-Title': 'Crawler AI',
      },
    });
  }

  async generateSelectors(html: string): Promise<Record<string, string>> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SCRAPER_SYSTEM_PROMPT },
        { role: 'user', content: buildGeneratePrompt(html) },
      ],
      max_tokens: 4096,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    console.log('[OpenRouter] Raw generateSelectors (500 chars):', raw.slice(0, 500));
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
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    console.log('[OpenRouter] Raw updateSelectors (500 chars):', raw.slice(0, 500));
    return cleanJsonResponse(raw);
  }
}
