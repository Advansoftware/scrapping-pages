import { AiFactory } from './ai.factory';
import { AiProviderType, UserAiConfig } from '../users/entities/user-ai-config.entity';
import { UsersService } from '../users/users.service';
import { BadRequestException } from '@nestjs/common';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { GoogleProvider } from './providers/google.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { OllamaProvider } from './providers/ollama.provider';

const mockUsersService = {
  decryptApiKey: jest.fn().mockReturnValue('decrypted-key-123'),
} as unknown as UsersService;

function makeConfig(provider: AiProviderType, extra: Partial<UserAiConfig> = {}): UserAiConfig {
  return {
    id: 1,
    userId: 1,
    provider,
    model: 'test-model',
    encryptedApiKey: 'encrypted-key',
    isConfigured: true,
    baseUrl: null,
    user: null,
    ...extra,
  } as UserAiConfig;
}

describe('AiFactory', () => {
  let factory: AiFactory;

  beforeEach(() => {
    factory = new AiFactory(mockUsersService);
    jest.clearAllMocks();
  });

  it('should create an AnthropicProvider', () => {
    const provider = factory.createProvider(makeConfig(AiProviderType.ANTHROPIC));
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('should create an OpenAiProvider', () => {
    const provider = factory.createProvider(makeConfig(AiProviderType.OPENAI));
    expect(provider).toBeInstanceOf(OpenAiProvider);
  });

  it('should create a GoogleProvider', () => {
    const provider = factory.createProvider(makeConfig(AiProviderType.GOOGLE));
    expect(provider).toBeInstanceOf(GoogleProvider);
  });

  it('should create an OpenRouterProvider', () => {
    const provider = factory.createProvider(makeConfig(AiProviderType.OPENROUTER));
    expect(provider).toBeInstanceOf(OpenRouterProvider);
  });

  it('should create an OllamaProvider with baseUrl', () => {
    const provider = factory.createProvider(
      makeConfig(AiProviderType.OLLAMA, { baseUrl: 'http://localhost:11434' }),
    );
    expect(provider).toBeInstanceOf(OllamaProvider);
  });

  it('should throw BadRequestException if config is null', () => {
    expect(() => factory.createProvider(null)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if isConfigured is false', () => {
    expect(() =>
      factory.createProvider(makeConfig(AiProviderType.ANTHROPIC, { isConfigured: false })),
    ).toThrow(BadRequestException);
  });

  it('should decrypt the API key from UsersService', () => {
    const config = makeConfig(AiProviderType.OPENAI);
    factory.createProvider(config);
    expect(mockUsersService.decryptApiKey).toHaveBeenCalledWith(config);
  });
});
