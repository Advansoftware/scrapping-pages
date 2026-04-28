import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnyAuthGuard } from '../auth/any-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

class ScrapeDto {
  /** @example https://www.amazon.com.br/dp/B09G9BL5CP */
  url: string;
}

@ApiTags('Crawler')
@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('scrape')
  @UseGuards(AnyAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Scrape a product URL',
    description: `Extracts product data from any URL using AI-generated CSS selectors.

**Authentication:** Accepts either:
- \`Authorization: Bearer <jwt>\` — from the admin frontend
- \`X-API-Key: <token>\` — for service-to-service calls (e.g. from licita-sync)

**How it works:**
1. Opens the URL with a headless browser (Puppeteer + Stealth)
2. If the domain is new → calls the user's configured AI provider to generate CSS selectors and saves them to the DB
3. If the domain is known → uses saved selectors (no AI call)
4. If selectors fail on critical fields → AI regenerates and retries automatically
5. All jobs are logged for reporting

**Requirements:** The calling user must have an AI provider configured via \`PUT /users/me/ai-config\`.`,
  })
  @ApiBody({ type: ScrapeDto })
  @ApiResponse({
    status: 200,
    description: 'Scraping result',
    schema: {
      example: {
        success: true,
        domain: 'amazon.com.br',
        selectorsUpdated: false,
        durationMs: 4200,
        data: {
          title: 'Apple AirPods Pro (2nd generation)',
          salePrice: 'R$ 1.499,00',
          originalPrice: 'R$ 1.899,00',
          image: 'https://m.media-amazon.com/images/I/...',
          hasCoupon: false,
          couponText: null,
          freeShipping: true,
          shippingText: 'Frete GRÁTIS',
          hasPixPrice: true,
          installments: { times: '12', value: '124,92' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid URL or AI config not set' })
  @ApiResponse({ status: 401, description: 'Missing or invalid credentials' })
  async scrapeProduct(
    @Body() body: { url: string },
    @CurrentUser() user: RequestUser,
  ) {
    if (!body.url) throw new BadRequestException('URL é obrigatória');
    try { new URL(body.url); } catch { throw new BadRequestException('URL inválida'); }
    return this.crawlerService.scrapeProduct(body.url, user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Aggregated scraping statistics' })
  @ApiResponse({
    status: 200,
    schema: { example: { total: 150, success: 140, failed: 10, updated: 5, domains: 23 } },
  })
  async getStats() {
    return this.crawlerService.getJobStats();
  }

  @Get('configs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'List saved domain configurations',
    description: 'Returns paginated list of AI-generated CSS selector configs per domain.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async listConfigs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.crawlerService.listConfigs(+page, +limit);
  }

  @Get('configs/:domain')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get CSS selector config for a specific domain' })
  @ApiParam({ name: 'domain', example: 'amazon.com.br' })
  async getConfig(@Param('domain') domain: string) {
    return this.crawlerService.getConfig(domain);
  }

  @Delete('configs/:domain')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete domain config',
    description: 'Removes the saved selectors for a domain. On the next scrape request the AI will regenerate them.',
  })
  @ApiParam({ name: 'domain', example: 'amazon.com.br' })
  async deleteConfig(@Param('domain') domain: string) {
    return this.crawlerService.deleteConfig(domain);
  }

  @Get('jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List scraping job history' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'domain', required: false, type: String, example: 'amazon.com.br' })
  async listJobs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('domain') domain?: string,
  ) {
    return this.crawlerService.listJobs(+page, +limit, domain);
  }
}
