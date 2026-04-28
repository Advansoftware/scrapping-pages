/**
 * Ollama provider — calls a locally running (or self-hosted) Ollama instance
 * via its OpenAI-compatible REST API.
 *
 * Default base URL: http://localhost:11434
 * @see https://github.com/ollama/ollama/blob/main/docs/openai.md
 */
import OpenAI from 'openai';
import { IAiProvider } from '../interfaces/ai-provider.interface';
import {
  SCRAPER_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildUpdatePrompt,
  cleanJsonResponse,
} from '../../common/ai-prompts';

export class OllamaProvider implements IAiProvider {
  private readonly client: OpenAI;

  constructor(
    private readonly model: string,
    baseUrl: string = 'http://localhost:11434',
  ) {
    this.client = new OpenAI({
      apiKey: 'ollama', // Ollama ignores the key but OpenAI client requires it
      baseURL: `${baseUrl.replace(/\/$/, '')}/v1`,
      timeout: 5 * 60 * 1000, // 5 minutes
    });
  }

  async generateSelectors(html: string): Promise<Record<string, string>> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SCRAPER_SYSTEM_PROMPT },
        { role: 'user', content: buildGeneratePrompt(html) },
      ],
      max_tokens: 8192,
      // @ts-ignore — Ollama-specific: disable reasoning tokens on thinking models
      think: false,
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
      max_tokens: 8192,
      // @ts-ignore — Ollama-specific: disable reasoning tokens on thinking models
      think: false,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    return cleanJsonResponse(raw);
  }
}
