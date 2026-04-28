import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { CrawlerConfig } from './entities/crawler-config.entity';
import { ScrapeJob, ScrapeJobStatus } from './entities/scrape-job.entity';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import { UserAiConfig } from '../users/entities/user-ai-config.entity';

puppeteerExtra.use(StealthPlugin());

export interface ProductData {
  title: string | null;
  salePrice: string | null;
  originalPrice: string | null;
  image: string | null;
  hasCoupon: boolean;
  couponText: string | null;
  freeShipping: boolean;
  shippingText: string | null;
  hasPixPrice: boolean;
  installments: { times: string; value: string } | null;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    @InjectRepository(CrawlerConfig)
    private readonly configRepo: Repository<CrawlerConfig>,
    @InjectRepository(ScrapeJob)
    private readonly jobRepo: Repository<ScrapeJob>,
    private readonly aiService: AiService,
    private readonly usersService: UsersService,
  ) { }

  async scrapeProduct(url: string, userId: number) {
    const startTime = Date.now();
    let domain: string;

    try {
      domain = new URL(url).hostname.replace('www.', '');
    } catch {
      return { success: false, error: 'URL inválida' };
    }

    // Resolve user's AI config
    const aiConfig = await this.usersService.getAiConfig(userId);
    if (!aiConfig?.isConfigured) {
      throw new BadRequestException(
        'Configure um provider de IA em PUT /users/me/ai-config antes de fazer scraping.',
      );
    }

    const job = await this.jobRepo.save({
      url,
      domain,
      userId,
      status: ScrapeJobStatus.RUNNING,
    });

    let config = await this.configRepo.findOne({ where: { domain } });
    let browser: Browser | null = null;

    try {
      browser = await puppeteerExtra.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--lang=pt-BR,pt',
          '--disable-dev-shm-usage',
        ],
      });

      const page: Page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      );
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));

      const html = await page.content();

      if (!config) {
        this.logger.log(`[${domain}] Novo domínio. Gerando seletores com IA (provider: ${aiConfig.provider})...`);
        const selectors = await this.aiService.generateSelectors(html, aiConfig);
        config = await this.configRepo.save({ domain, selectors, version: 1, failCount: 0 });
      }

      const result = await this._extractData(page, config.selectors);
      const failedFields = this._getFailedFields(result);

      if (failedFields.length > 0) {
        const pageTitle = await page.title();
        this.logger.warn(`[${domain}] ${failedFields.length} campo(s) falharam. Título da página: "${pageTitle}". Atualizando seletores...`);
        const updatedSelectors = await this.aiService.updateSelectorsAfterFailure(
          html, config.selectors, failedFields, aiConfig,
        );
        await this.configRepo.save({
          ...config,
          selectors: updatedSelectors,
          version: config.version + 1,
          failCount: 0,
          lastTestedAt: new Date(),
        });

        const retryResult = await this._extractData(page, updatedSelectors);
        const duration = Date.now() - startTime;
        await this.jobRepo.save({ ...job, status: ScrapeJobStatus.SUCCESS, result: retryResult, selectorsUpdated: true, durationMs: duration });
        
        this.logger.log(`[${domain}] Scraping concluído com sucesso após re-treino da IA. Resultado: ${JSON.stringify(retryResult)}`);
        return { success: true, data: retryResult, domain, selectorsUpdated: true, durationMs: duration };
      }

      await this.configRepo.save({ ...config, lastTestedAt: new Date(), failCount: 0 });
      const duration = Date.now() - startTime;
      await this.jobRepo.save({ ...job, status: ScrapeJobStatus.SUCCESS, result, selectorsUpdated: false, durationMs: duration });
      
      this.logger.log(`[${domain}] Scraping concluído com sucesso. Resultado: ${JSON.stringify(result)}`);
      return { success: true, data: result, domain, selectorsUpdated: false, durationMs: duration };

    } catch (error) {
      if (config) {
        await this.configRepo.save({ ...config, failCount: (config.failCount || 0) + 1 });
      }
      const duration = Date.now() - startTime;
      await this.jobRepo.save({ ...job, status: ScrapeJobStatus.FAILED, error: error.message, durationMs: duration });
      this.logger.error(`[${domain}] Scraping falhou: ${error.message}`, error.stack);
      return { success: false, error: error.message, domain, durationMs: duration };
    } finally {
      if (browser) await browser.close();
    }
  }

  private async _extractData(page: Page, selectors: Record<string, string>): Promise<ProductData> {
    return await page.evaluate((sel: Record<string, string>) => {
      const get = (selector: string | null): string | null => {
        if (!selector) return null;
        const el = document.querySelector(selector);
        return el
          ? ((el as HTMLElement).innerText || el.textContent || el.getAttribute('src') || el.getAttribute('content') || '').trim()
          : null;
      };

      const bodyText = document.body.innerText.toLowerCase();
      const imgEl = sel.image ? document.querySelector(sel.image) : null;
      const image = imgEl
        ? (imgEl as HTMLImageElement).dataset?.oldHires || (imgEl as HTMLImageElement).src || imgEl.getAttribute('content') || null
        : null;

      const shippingText = get(sel.shipping) || '';
      const freeShipping = shippingText.toLowerCase().includes('grátis') || shippingText.toLowerCase().includes('gratuito') || bodyText.includes('frete grátis');
      const hasPixPrice = bodyText.includes('pix') && (bodyText.includes('à vista no pix') || bodyText.includes('no pix'));
      const installmentMatch = bodyText.match(/em até (\d+)x de r\$\s?([\d.,]+)/);

      return {
        title: get(sel.title),
        salePrice: get(sel.salePrice),
        originalPrice: get(sel.originalPrice),
        image,
        hasCoupon: !!get(sel.coupon),
        couponText: get(sel.coupon),
        freeShipping,
        shippingText: shippingText || null,
        hasPixPrice,
        installments: installmentMatch ? { times: installmentMatch[1], value: installmentMatch[2] } : null,
      };
    }, selectors);
  }

  private _getFailedFields(result: ProductData): string[] {
    const critical: (keyof ProductData)[] = ['title', 'salePrice', 'image'];
    return critical.filter((field) => !result[field]);
  }

  async listConfigs(page = 1, limit = 20) {
    const [configs, total] = await this.configRepo.findAndCount({
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { configs, total, page, limit };
  }

  async getConfig(domain: string) {
    return this.configRepo.findOne({ where: { domain } });
  }

  async deleteConfig(domain: string) {
    const config = await this.configRepo.findOne({ where: { domain } });
    if (!config) return { message: `Config para "${domain}" não encontrada` };
    await this.configRepo.remove(config);
    return { message: `Config de "${domain}" removida. Será regenerada no próximo scraping.` };
  }

  async listJobs(page = 1, limit = 20, domain?: string) {
    const where: any = {};
    if (domain) where.domain = domain;
    const [jobs, total] = await this.jobRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { jobs, total, page, limit };
  }

  async getJobStats() {
    const total = await this.jobRepo.count();
    const success = await this.jobRepo.count({ where: { status: ScrapeJobStatus.SUCCESS } });
    const failed = await this.jobRepo.count({ where: { status: ScrapeJobStatus.FAILED } });
    const updated = await this.jobRepo.count({ where: { selectorsUpdated: true } });
    const domains = await this.configRepo.count();
    return { total, success, failed, updated, domains };
  }
}
