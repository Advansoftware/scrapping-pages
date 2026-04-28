import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AiFactory } from './ai.factory';
import { UserAiConfig } from '../users/entities/user-ai-config.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly factory: AiFactory) { }

  async generateSelectors(
    html: string,
    aiConfig: UserAiConfig,
  ): Promise<Record<string, string>> {
    this.logger.log(`[IA] Iniciando geração de seletores (Provider: ${aiConfig.provider}). Tamanho do HTML enviado: ${html.length} bytes.`);
    const provider = this.factory.createProvider(aiConfig);
    const result = await provider.generateSelectors(html);
    this.logger.log(`[IA] Retorno da geração de seletores: ${JSON.stringify(result)}`);
    return result;
  }

  async updateSelectorsAfterFailure(
    html: string,
    previousSelectors: Record<string, string>,
    failedFields: string[],
    aiConfig: UserAiConfig,
  ): Promise<Record<string, string>> {
    if (!aiConfig?.isConfigured) {
      throw new BadRequestException('AI config not found for user');
    }
    this.logger.log(`[IA] Atualizando seletores falhos (Provider: ${aiConfig.provider}). Campos falhos: ${failedFields.join(', ')}`);
    const provider = this.factory.createProvider(aiConfig);
    const result = await provider.updateSelectorsAfterFailure(html, previousSelectors, failedFields);
    this.logger.log(`[IA] Retorno da atualização de seletores: ${JSON.stringify(result)}`);
    return result;
  }
}
