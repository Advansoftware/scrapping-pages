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
  constructor(private readonly crawlerService: CrawlerService) { }

  @Post('scrape')
  @UseGuards(AnyAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Enqueue a product scraping job',
    description: `Enqueues an async scraping job. Returns a jobId immediately.
Poll GET /crawler/jobs/:id to check status and retrieve the result.`,
  })
  @ApiBody({ type: ScrapeDto })
  @ApiResponse({
    status: 200,
    description: 'Job enqueued',
    schema: { example: { jobId: 42, status: 'pending', queuePosition: 0 } },
  })
  async scrapeProduct(
    @Body() body: { url: string },
    @CurrentUser() user: RequestUser,
  ) {
    if (!body.url) throw new BadRequestException('URL é obrigatória');
    try { new URL(body.url); } catch { throw new BadRequestException('URL inválida'); }
    return this.crawlerService.scrapeProduct(body.url, user.id);
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Test existing selectors on a URL (no AI, no job record)',
    description: 'Applies the currently saved selectors for the domain+pageType and returns the extracted data synchronously. Does NOT create a job history entry.',
  })
  @ApiBody({ type: ScrapeDto })
  async previewScrape(@Body() body: { url: string }) {
    if (!body.url) throw new BadRequestException('URL é obrigatória');
    try { new URL(body.url); } catch { throw new BadRequestException('URL inválida'); }
    return this.crawlerService.previewScrape(body.url);
  }

  @Get('stats')
  @UseGuards(AnyAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Aggregated scraping statistics' })
  async getStats() {
    return this.crawlerService.getJobStats();
  }

  @Get('configs')
  @UseGuards(AnyAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'List saved domain configurations' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async listConfigs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.crawlerService.listConfigs(+page, +limit);
  }

  @Get('configs/:domain')
  @UseGuards(AnyAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get all page-type configs for a domain' })
  @ApiParam({ name: 'domain', example: 'amazon.com.br' })
  async getConfig(@Param('domain') domain: string) {
    return this.crawlerService.getConfig(domain);
  }

  @Delete('configs/:domain')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete domain config (all page types or one)' })
  @ApiParam({ name: 'domain', example: 'amazon.com.br' })
  @ApiQuery({ name: 'pageType', required: false, example: 'product' })
  async deleteConfig(
    @Param('domain') domain: string,
    @Query('pageType') pageType?: string,
  ) {
    return this.crawlerService.deleteConfig(domain, pageType);
  }

  @Get('jobs')
  @UseGuards(AnyAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'List scraping job history' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'domain', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async listJobs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('domain') domain?: string,
    @Query('status') status?: string,
  ) {
    return this.crawlerService.listJobs(+page, +limit, domain, status);
  }

  @Get('jobs/:id')
  @UseGuards(AnyAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Get a single job by ID (for polling)' })
  @ApiParam({ name: 'id', type: Number })
  async getJobById(@Param('id') id: string) {
    return this.crawlerService.getJobById(+id);
  }

  @Delete('jobs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a job from history' })
  @ApiParam({ name: 'id', type: Number })
  async deleteJob(@Param('id') id: string) {
    return this.crawlerService.deleteJob(+id);
  }
}

