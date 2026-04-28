import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { AiProviderType } from '../entities/user-ai-config.entity';

export class SetAiConfigDto {
  @ApiProperty({
    enum: AiProviderType,
    example: AiProviderType.ANTHROPIC,
    description: `AI provider to use. Supported values:
- \`anthropic\` — Claude models via Anthropic API
- \`openai\`    — GPT models via OpenAI API
- \`google\`    — Gemini models via Google AI API
- \`openrouter\`— Any model via OpenRouter (openrouter.ai)
- \`ollama\`    — Local / self-hosted models via Ollama`,
  })
  @IsEnum(AiProviderType)
  provider: AiProviderType;

  @ApiProperty({
    example: 'claude-opus-4-5',
    description: 'Model identifier accepted by the chosen provider.',
  })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    example: 'sk-ant-...',
    description: 'API key for the provider. Stored encrypted — never returned in responses.',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:11434',
    description: 'Base URL (required for Ollama; optional for custom OpenAI-compatible endpoints).',
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;
}

export class AiConfigResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: AiProviderType, example: AiProviderType.ANTHROPIC })
  provider: AiProviderType;

  @ApiProperty({ example: 'claude-opus-4-5' })
  model: string;

  @ApiProperty({
    example: 'sk-ant-***...***',
    description: 'Masked API key — only first/last 4 chars are shown.',
  })
  maskedApiKey: string | null;

  @ApiPropertyOptional({ example: 'http://localhost:11434' })
  baseUrl: string | null;

  @ApiProperty({ example: true })
  isConfigured: boolean;

  @ApiProperty()
  updatedAt: Date;
}
