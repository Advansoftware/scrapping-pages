"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const puppeteerExtra = require("puppeteer-extra");
const puppeteer_extra_plugin_stealth_1 = require("puppeteer-extra-plugin-stealth");
const crawler_config_entity_1 = require("./entities/crawler-config.entity");
const scrape_job_entity_1 = require("./entities/scrape-job.entity");
const ai_service_1 = require("../ai/ai.service");
const users_service_1 = require("../users/users.service");
puppeteerExtra.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
let CrawlerService = CrawlerService_1 = class CrawlerService {
    constructor(configRepo, jobRepo, aiService, usersService) {
        this.configRepo = configRepo;
        this.jobRepo = jobRepo;
        this.aiService = aiService;
        this.usersService = usersService;
        this.logger = new common_1.Logger(CrawlerService_1.name);
    }
    async scrapeProduct(url, userId) {
        const startTime = Date.now();
        let domain;
        try {
            domain = new URL(url).hostname.replace('www.', '');
        }
        catch {
            return { success: false, error: 'URL inválida' };
        }
        const aiConfig = await this.usersService.getAiConfig(userId);
        if (!aiConfig?.isConfigured) {
            throw new common_1.BadRequestException('Configure um provider de IA em PUT /users/me/ai-config antes de fazer scraping.');
        }
        const job = await this.jobRepo.save({
            url,
            domain,
            userId,
            status: scrape_job_entity_1.ScrapeJobStatus.RUNNING,
        });
        let config = await this.configRepo.findOne({ where: { domain } });
        let browser = null;
        try {
            browser = await puppeteerExtra.default.launch({
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
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
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
                this.logger.warn(`[${domain}] ${failedFields.length} campo(s) falharam. Atualizando seletores...`);
                const updatedSelectors = await this.aiService.updateSelectorsAfterFailure(html, config.selectors, failedFields, aiConfig);
                await this.configRepo.save({
                    ...config,
                    selectors: updatedSelectors,
                    version: config.version + 1,
                    failCount: 0,
                    lastTestedAt: new Date(),
                });
                const retryResult = await this._extractData(page, updatedSelectors);
                const duration = Date.now() - startTime;
                await this.jobRepo.save({ ...job, status: scrape_job_entity_1.ScrapeJobStatus.SUCCESS, result: retryResult, selectorsUpdated: true, durationMs: duration });
                return { success: true, data: retryResult, domain, selectorsUpdated: true, durationMs: duration };
            }
            await this.configRepo.save({ ...config, lastTestedAt: new Date(), failCount: 0 });
            const duration = Date.now() - startTime;
            await this.jobRepo.save({ ...job, status: scrape_job_entity_1.ScrapeJobStatus.SUCCESS, result, selectorsUpdated: false, durationMs: duration });
            return { success: true, data: result, domain, selectorsUpdated: false, durationMs: duration };
        }
        catch (error) {
            if (config) {
                await this.configRepo.save({ ...config, failCount: (config.failCount || 0) + 1 });
            }
            const duration = Date.now() - startTime;
            await this.jobRepo.save({ ...job, status: scrape_job_entity_1.ScrapeJobStatus.FAILED, error: error.message, durationMs: duration });
            this.logger.error(`[${domain}] Scraping falhou: ${error.message}`);
            return { success: false, error: error.message, domain, durationMs: duration };
        }
        finally {
            if (browser)
                await browser.close();
        }
    }
    async _extractData(page, selectors) {
        return await page.evaluate((sel) => {
            const get = (selector) => {
                if (!selector)
                    return null;
                const el = document.querySelector(selector);
                return el
                    ? (el.innerText || el.textContent || el.getAttribute('src') || el.getAttribute('content') || '').trim()
                    : null;
            };
            const bodyText = document.body.innerText.toLowerCase();
            const imgEl = sel.image ? document.querySelector(sel.image) : null;
            const image = imgEl
                ? imgEl.dataset?.oldHires || imgEl.src || imgEl.getAttribute('content') || null
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
    _getFailedFields(result) {
        const critical = ['title', 'salePrice', 'image'];
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
    async getConfig(domain) {
        return this.configRepo.findOne({ where: { domain } });
    }
    async deleteConfig(domain) {
        const config = await this.configRepo.findOne({ where: { domain } });
        if (!config)
            return { message: `Config para "${domain}" não encontrada` };
        await this.configRepo.remove(config);
        return { message: `Config de "${domain}" removida. Será regenerada no próximo scraping.` };
    }
    async listJobs(page = 1, limit = 20, domain) {
        const where = {};
        if (domain)
            where.domain = domain;
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
        const success = await this.jobRepo.count({ where: { status: scrape_job_entity_1.ScrapeJobStatus.SUCCESS } });
        const failed = await this.jobRepo.count({ where: { status: scrape_job_entity_1.ScrapeJobStatus.FAILED } });
        const updated = await this.jobRepo.count({ where: { selectorsUpdated: true } });
        const domains = await this.configRepo.count();
        return { total, success, failed, updated, domains };
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(crawler_config_entity_1.CrawlerConfig)),
    __param(1, (0, typeorm_1.InjectRepository)(scrape_job_entity_1.ScrapeJob)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        ai_service_1.AiService,
        users_service_1.UsersService])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map