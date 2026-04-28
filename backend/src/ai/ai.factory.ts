import { Injectable, BadRequestException } from '@nestjs/common';
import { IAiProvider } from './interfaces/ai-provider.interface';
import { UserAiConfig, AiProviderType } from '../users/entities/user-ai-config.entity';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { GoogleProvider } from './providers/google.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { UsersService } from '../users/users.service';

@Injectable()
export class AiFactory {
  constructor(private readonly usersService: UsersService) { }

  /**
   * Returns a concrete {@link IAiProvider} instance wired with the user's
   * stored credentials and model choice.
   *
   * @throws BadRequestException if the user has no AI config or the
   *         provider is unknown.
   */
  createProvider(config: UserAiConfig): IAiProvider {
    if (!config || !config.isConfigured) {
      throw new BadRequestException(
        'Nenhuma configuração de IA encontrada para este usuário. ' +
        'Configure um provider em PUT /users/:id/ai-config.',
      );
    }

    const apiKey = this.usersService.decryptApiKey(config);

    switch (config.provider) {
      case AiProviderType.ANTHROPIC:
        return new AnthropicProvider(apiKey!, config.model);

      case AiProviderType.OPENAI:
        return new OpenAiProvider(apiKey!, config.model);

      case AiProviderType.GOOGLE:
        return new GoogleProvider(apiKey!, config.model);

      case AiProviderType.OPENROUTER:
        return new OpenRouterProvider(apiKey!, config.model);

      case AiProviderType.OLLAMA:
        return new OllamaProvider(
          config.model,
          config.baseUrl ?? 'http://localhost:11434',
        );

      default:
        throw new BadRequestException(
          `Provider desconhecido: "${config.provider}". ` +
          `Valores válidos: ${Object.values(AiProviderType).join(', ')}`,
        );
    }
  }
}
