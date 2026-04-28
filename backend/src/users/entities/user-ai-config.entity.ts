import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

/**
 * Supported AI provider identifiers.
 * Each maps to a concrete provider implementation in `src/ai/providers/`.
 */
export enum AiProviderType {
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
  GOOGLE = 'google',
  OPENROUTER = 'openrouter',
  OLLAMA = 'ollama',
}

/** Well-known model suggestions per provider (non-exhaustive). */
export const PROVIDER_MODELS: Record<AiProviderType, string[]> = {
  [AiProviderType.ANTHROPIC]: [
    'claude-opus-4-5',
    'claude-3-7-sonnet-20250219',
    'claude-3-5-haiku-20241022',
  ],
  [AiProviderType.OPENAI]: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ],
  [AiProviderType.GOOGLE]: [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
  ],
  [AiProviderType.OPENROUTER]: [
    'openai/gpt-4o',
    'anthropic/claude-opus-4-5',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-7b-instruct',
    'meta-llama/llama-3.1-8b-instruct:free',
  ],
  [AiProviderType.OLLAMA]: [
    'llama3.2',
    'llama3.1',
    'mistral',
    'codellama',
    'phi3',
  ],
};

@Entity('user_ai_configs')
export class UserAiConfig {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  userId: number;

  @OneToOne(() => User, (user) => user.aiConfig)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ enum: AiProviderType, example: AiProviderType.ANTHROPIC })
  @Column({ type: 'enum', enum: AiProviderType, default: AiProviderType.ANTHROPIC })
  provider: AiProviderType;

  @ApiProperty({ example: 'claude-opus-4-5' })
  @Column({ default: 'claude-opus-4-5' })
  model: string;

  /**
   * API key for the chosen provider, stored **encrypted** (AES-256-CBC).
   * Never returned in API responses.
   */
  @Column({ nullable: true })
  encryptedApiKey: string | null;

  /**
   * Base URL used by Ollama (or a custom OpenAI-compatible endpoint).
   * Example: `http://localhost:11434`
   */
  @ApiProperty({ example: 'http://localhost:11434', required: false })
  @Column({ nullable: true })
  baseUrl: string | null;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isConfigured: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
