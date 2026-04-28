import { Injectable, Logger, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
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
import { hasValidSelectors } from '../common/ai-prompts';

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

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
  '--lang=pt-BR,pt',
  '--disable-dev-shm-usage',
];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

@Injectable()
export class CrawlerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerService.name);
  private _activeScrapes = 0;
  private readonly MAX_CONCURRENT = 2;

  constructor(
    @InjectRepository(CrawlerConfig)
    private readonly configRepo: Repository<CrawlerConfig>,
    @InjectRepository(ScrapeJob)
    private readonly jobRepo: Repository<ScrapeJob>,
    private readonly aiService: AiService,
    private readonly usersService: UsersService,
  ) { }

  async onModuleInit() {
    // Mark any jobs left in running/pending state (from before last restart) as failed
    const stale = await this.jobRepo.find({
      where: [
        { status: ScrapeJobStatus.RUNNING },
        { status: ScrapeJobStatus.PENDING },
      ],
    });
    if (stale.length > 0) {
      await this.jobRepo.save(
        stale.map((j) => ({
          ...j,
          status: ScrapeJobStatus.FAILED,
          error: 'Job interrompido por reinício do servidor',
        })),
      );
      this.logger.warn(`Marcados ${stale.length} job(s) travados como falha no boot.`);
    }
  }

  /**
   * Enqueue a scraping job. Returns immediately with a jobId.
   * The caller should poll GET /crawler/jobs/:id for the result.
   */
  async scrapeProduct(
    url: string,
    userId: number,
  ): Promise<{ jobId: number; status: string; queuePosition: number }> {
    let domain: string;
    let pageType: string;
    try {
      domain = new URL(url).hostname.replace('www.', '');
      pageType = this._extractPageType(url);
    } catch {
      throw new BadRequestException('URL inválida');
    }

    const aiConfig = await this.usersService.getAiConfig(userId);
    if (!aiConfig?.isConfigured) {
      throw new BadRequestException(
        'Configure um provider de IA em PUT /users/me/ai-config antes de fazer scraping.',
      );
    }

    const job = await this.jobRepo.save({
      url,
      domain,
      pageType,
      userId,
      status: ScrapeJobStatus.PENDING,
    });

    const queuePosition = this._activeScrapes;

    // Fire-and-forget: process in the background, HTTP response is immediate
    setImmediate(() =>
      this._doScrape(job.id, url, domain, pageType, aiConfig).catch((err) => {
        this.logger.error(`Job ${job.id} falhou inesperadamente: ${err.message}`);
      }),
    );

    return { jobId: job.id, status: 'pending', queuePosition };
  }

  /**
   * Internal: runs the actual Puppeteer + AI scraping pipeline.
   */
  private async _doScrape(
    jobId: number,
    url: string,
    domain: string,
    pageType: string,
    aiConfig: UserAiConfig,
  ): Promise<void> {
    // Simple concurrency gate — avoids spawning too many Puppeteer instances
    const maxWait = 10 * 60 * 1000;
    const waitStart = Date.now();
    while (this._activeScrapes >= this.MAX_CONCURRENT) {
      if (Date.now() - waitStart > maxWait) {
        await this.jobRepo.update(jobId, {
          status: ScrapeJobStatus.FAILED,
          error: 'Timeout esperando slot na fila',
        });
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    this._activeScrapes++;
    await this.jobRepo.update(jobId, { status: ScrapeJobStatus.RUNNING });
    const startTime = Date.now();
    let browser: Browser | null = null;

    try {
      browser = await puppeteerExtra.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: LAUNCH_ARGS,
      });

      const page: Page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });
      await page.setViewport({ width: 1366, height: 768 });

      // Use networkidle2 so JS-rendered content (React, Vue) is fully loaded
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

      // Scroll down so lazy-loaded images and components are triggered
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.6));
      await new Promise((r) => setTimeout(r, 3000));

      // Try to wait for common product-page selectors (title or price) to appear
      try {
        await page.waitForSelector('h1, [class*="price"], [class*="title"], [class*="produto"]', {
          timeout: 8000,
        });
      } catch {
        // Continue even if selector not found — page may use non-standard markup
        this.logger.debug(`[${domain}/${pageType}] Seletor de produto não encontrado dentro do timeout, continuando mesmo assim.`);
      }

      const html = await page.content();
      this.logger.debug(
        `[${domain}/${pageType}] HTML capturado: ${html.length} chars. Primeiros 200 do body: ` +
        html.replace(/<script[\s\S]*?<\/script>/gi, '').slice(0, 200),
      );
      let config = await this.configRepo.findOne({ where: { domain, pageType } });

      // ──────────────────────────────────────────────────────────────────────
      // STEP 1: Get or generate selectors
      // ──────────────────────────────────────────────────────────────────────
      const needsGeneration = !config || !hasValidSelectors(config.selectors);
      if (needsGeneration) {
        this.logger.log(
          `[${domain}/${pageType}] ${config ? 'Seletores inválidos/vazios, regenerando' : 'Novo domínio'} (provider: ${aiConfig.provider})...`,
        );
        const selectors = await this._generateWithRetry(html, aiConfig, domain, pageType);
        if (!hasValidSelectors(selectors)) {
          throw new Error(
            `A IA não conseguiu gerar seletores válidos para ${domain}. ` +
            `Resposta: ${JSON.stringify(selectors)}. Verifique se o modelo está configurado corretamente.`,
          );
        }
        this.logger.log(`[${domain}/${pageType}] Seletores gerados: ${JSON.stringify(selectors)}`);
        if (config) {
          config = await this.configRepo.save({ ...config, selectors, version: config.version + 1, failCount: 0 });
        } else {
          config = await this.configRepo.save({ domain, pageType, selectors, version: 1, failCount: 0 });
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // STEP 2: Extract data with current selectors
      // ──────────────────────────────────────────────────────────────────────
      const result = await this._extractData(page, config.selectors);
      const failedFields = this._getFailedFields(result);
      this.logger.log(`[${domain}/${pageType}] Seletores: ${JSON.stringify(config.selectors)}`);
      this.logger.log(`[${domain}/${pageType}] Resultado: ${JSON.stringify(result)}`);

      if (failedFields.length > 0) {
        // ────────────────────────────────────────────────────────────────────
        // STEP 3: Update selectors via AI and retry once
        // ────────────────────────────────────────────────────────────────────
        this.logger.warn(
          `[${domain}/${pageType}] Campos falharam: [${failedFields.join(', ')}]. Atualizando seletores...`,
        );
        const updatedSelectors = await this._updateWithRetry(
          html, config.selectors, failedFields, aiConfig, domain, pageType,
        );
        this.logger.log(`[${domain}/${pageType}] Seletores atualizados: ${JSON.stringify(updatedSelectors)}`);

        await this.configRepo.save({
          ...config,
          selectors: hasValidSelectors(updatedSelectors) ? updatedSelectors : config.selectors,
          version: config.version + 1,
          failCount: 0,
          lastTestedAt: new Date(),
        });

        const retryResult = hasValidSelectors(updatedSelectors)
          ? await this._extractData(page, updatedSelectors)
          : result;
        this.logger.log(`[${domain}/${pageType}] Resultado após re-treino: ${JSON.stringify(retryResult)}`);

        const stillFailed = this._getFailedFields(retryResult);
        const duration = Date.now() - startTime;

        if (stillFailed.length === failedFields.length && !hasValidSelectors(updatedSelectors)) {
          // All critical fields still null — partial failure
          await this.jobRepo.update(jobId, {
            status: ScrapeJobStatus.FAILED,
            result: retryResult as any,
            selectorsUpdated: hasValidSelectors(updatedSelectors),
            error: `Campos não extraídos mesmo após atualização de seletores: ${stillFailed.join(', ')}`,
            durationMs: duration,
          });
        } else {
          await this.jobRepo.update(jobId, {
            status: ScrapeJobStatus.SUCCESS,
            result: retryResult as any,
            selectorsUpdated: true,
            durationMs: duration,
          });
        }
      } else {
        await this.configRepo.save({ ...config, lastTestedAt: new Date(), failCount: 0 });
        const duration = Date.now() - startTime;
        await this.jobRepo.update(jobId, {
          status: ScrapeJobStatus.SUCCESS,
          result: result as any,
          selectorsUpdated: false,
          durationMs: duration,
        });
        this.logger.log(`[${domain}/${pageType}] Scraping concluído com sucesso.`);
      }
    } catch (error) {
      const cfg = await this.configRepo.findOne({ where: { domain, pageType } });
      if (cfg) {
        await this.configRepo.save({ ...cfg, failCount: (cfg.failCount || 0) + 1 });
      }
      const duration = Date.now() - startTime;
      await this.jobRepo.update(jobId, {
        status: ScrapeJobStatus.FAILED,
        error: error.message,
        durationMs: duration,
      });
      this.logger.error(`[${domain}/${pageType}] Scraping falhou: ${error.message}`, error.stack);
    } finally {
      this._activeScrapes--;
      if (browser) await browser.close();
    }
  }

  /**
   * Preview: scrape a URL using EXISTING selectors (no AI, no job record).
   * Used for testing selectors from the configs screen.
   */
  async previewScrape(url: string): Promise<{
    domain: string;
    pageType: string;
    selectors: Record<string, string>;
    result: ProductData;
  }> {
    let domain: string;
    let pageType: string;
    try {
      domain = new URL(url).hostname.replace('www.', '');
      pageType = this._extractPageType(url);
    } catch {
      throw new BadRequestException('URL inválida');
    }

    const config = await this.configRepo.findOne({ where: { domain, pageType } });
    if (!config) {
      throw new BadRequestException(
        `Nenhum seletor configurado para ${domain}/${pageType}. Execute um scraping com IA primeiro.`,
      );
    }

    let browser: Browser | null = null;
    try {
      browser = await puppeteerExtra.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: LAUNCH_ARGS,
      });
      const page: Page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.6));
      await new Promise((r) => setTimeout(r, 3000));
      const result = await this._extractData(page, config.selectors);
      return { domain, pageType, selectors: config.selectors, result };
    } finally {
      if (browser) await browser.close();
    }
  }

  async getJobById(id: number): Promise<ScrapeJob> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job #${id} não encontrado`);
    return job;
  }

  async deleteJob(id: number): Promise<{ message: string }> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job #${id} não encontrado`);
    if (job.status === ScrapeJobStatus.RUNNING || job.status === ScrapeJobStatus.PENDING) {
      throw new BadRequestException('Não é possível excluir um job em execução ou na fila.');
    }
    await this.jobRepo.remove(job);
    return { message: `Job #${id} excluído.` };
  }

  /**
   * Detects the page template type from the URL.
   * Returns 'product', 'home', 'listing', etc.
   */
  private _extractPageType(url: string): string {
    try {
      const u = new URL(url);
      const hostname = u.hostname;
      const fullPath = hostname + u.pathname;

      // Subdomain-based: produto.mercadolivre.com.br → product
      const sub = hostname.split('.')[0];
      if (sub === 'produto' || sub === 'item') return 'product';

      // URL path patterns that indicate a product page
      const productPatterns: RegExp[] = [
        /\/dp\/[A-Z0-9]{5,}/i,           // Amazon: /dp/B0CRMZHDG8
        /\/(MLB|MLA|MLM|MLC|MLU)-?\d+/,  // MercadoLivre ID
        /\/up\/(MLU|MLBU)[A-Z0-9]+/i,    // ML offer path
        /\/p\/(MLB|MLA|MLM)[A-Z0-9]+/i,  // ML canonical product
        /\/product[s]?\//i,
        /\/produto\//i,
        /\/item\//i,
        /\/[a-zA-Z0-9-]+-\d{6,}/,        // slug with long numeric ID
      ];

      for (const p of productPatterns) {
        if (p.test(fullPath)) return 'product';
      }

      const pathDepth = u.pathname.split('/').filter(Boolean).length;
      if (pathDepth === 0) return 'home';
      if (pathDepth >= 3) return 'product'; // deep paths are usually product pages
      return 'listing';
    } catch {
      return 'product';
    }
  }

  /**
   * Calls generateSelectors with up to 3 retries and exponential backoff for 429 errors.
   */
  private async _generateWithRetry(
    html: string,
    aiConfig: UserAiConfig,
    domain: string,
    pageType: string,
    maxAttempts = 3,
  ): Promise<Record<string, string>> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.aiService.generateSelectors(html, aiConfig);
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('429') && attempt < maxAttempts) {
          const wait = attempt * 60000; // 60s, 120s
          this.logger.warn(`[${domain}/${pageType}] Rate limit (429), aguardando ${wait / 1000}s antes de tentar novamente (${attempt}/${maxAttempts})...`);
          await new Promise((r) => setTimeout(r, wait));
        } else {
          throw err;
        }
      }
    }
    throw lastError;
  }

  /**
   * Calls updateSelectorsAfterFailure with up to 3 retries and exponential backoff.
   */
  private async _updateWithRetry(
    html: string,
    previous: Record<string, string>,
    failed: string[],
    aiConfig: UserAiConfig,
    domain: string,
    pageType: string,
    maxAttempts = 3,
  ): Promise<Record<string, string>> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.aiService.updateSelectorsAfterFailure(html, previous, failed, aiConfig);
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('429') && attempt < maxAttempts) {
          const wait = attempt * 60000; // 60s, 120s
          this.logger.warn(`[${domain}/${pageType}] Rate limit (429) no update, aguardando ${wait / 1000}s (${attempt}/${maxAttempts})...`);
          await new Promise((r) => setTimeout(r, wait));
        } else {
          throw err;
        }
      }
    }
    throw lastError;
  }

  private async _extractData(page: Page, selectors: Record<string, string>): Promise<ProductData> {
    return await page.evaluate((sel: Record<string, string>) => {
      const getText = (selector: string | null): string | null => {
        if (!selector) return null;
        const el = document.querySelector(selector);
        if (!el) return null;
        return ((el as HTMLElement).innerText || el.textContent || '').trim() || null;
      };

      const getImage = (selector: string | null): string | null => {
        if (!selector) return null;
        const el = document.querySelector(selector) as HTMLImageElement | null;
        if (!el) return null;
        return (
          el.getAttribute('data-zoom') ||
          el.getAttribute('data-old-hires') ||
          (el as any).dataset?.oldHires ||
          el.getAttribute('data-src') ||
          el.src ||
          el.getAttribute('content') ||
          null
        );
      };

      const bodyText = document.body.innerText.toLowerCase();

      const shippingText = getText(sel.shipping) || '';
      const freeShipping =
        shippingText.toLowerCase().includes('grátis') ||
        shippingText.toLowerCase().includes('gratuito') ||
        bodyText.includes('frete grátis');
      const hasPixPrice =
        bodyText.includes('pix') &&
        (bodyText.includes('à vista no pix') || bodyText.includes('no pix'));
      const installmentMatch = bodyText.match(/em até (\d+)x de r\$\s?([\d.,]+)/);

      return {
        title: getText(sel.title),
        salePrice: getText(sel.salePrice),
        originalPrice: getText(sel.originalPrice),
        image: getImage(sel.image),
        hasCoupon: !!getText(sel.coupon),
        couponText: getText(sel.coupon),
        freeShipping,
        shippingText: shippingText || null,
        hasPixPrice,
        installments: installmentMatch
          ? { times: installmentMatch[1], value: installmentMatch[2] }
          : null,
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
    return this.configRepo.find({ where: { domain }, order: { pageType: 'ASC' } });
  }

  async deleteConfig(domain: string, pageType?: string) {
    if (pageType) {
      const config = await this.configRepo.findOne({ where: { domain, pageType } });
      if (!config) return { message: `Config para "${domain}/${pageType}" não encontrada` };
      await this.configRepo.remove(config);
      return { message: `Config de "${domain}/${pageType}" removida.` };
    }
    // Delete all page types for domain
    const configs = await this.configRepo.find({ where: { domain } });
    if (!configs.length) return { message: `Nenhuma config para "${domain}"` };
    await this.configRepo.remove(configs);
    return { message: `Todas as configs de "${domain}" removidas. Serão regeneradas no próximo scraping.` };
  }

  async listJobs(page = 1, limit = 20, domain?: string, status?: string) {
    const where: any = {};
    if (domain) where.domain = domain;
    if (status) where.status = status;
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
    const pending = await this.jobRepo.count({ where: { status: ScrapeJobStatus.PENDING } });
    const running = await this.jobRepo.count({ where: { status: ScrapeJobStatus.RUNNING } });
    const updated = await this.jobRepo.count({ where: { selectorsUpdated: true } });
    const domains = await this.configRepo.count();
    return { total, success, failed, pending, running, updated, domains, activeScrapes: this._activeScrapes };
  }
}
