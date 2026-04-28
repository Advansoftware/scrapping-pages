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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crawler_service_1 = require("./crawler.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const any_auth_guard_1 = require("../auth/any-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
class ScrapeDto {
}
let CrawlerController = class CrawlerController {
    constructor(crawlerService) {
        this.crawlerService = crawlerService;
    }
    async scrapeProduct(body, user) {
        if (!body.url)
            throw new common_1.BadRequestException('URL é obrigatória');
        try {
            new URL(body.url);
        }
        catch {
            throw new common_1.BadRequestException('URL inválida');
        }
        return this.crawlerService.scrapeProduct(body.url, user.id);
    }
    async getStats() {
        return this.crawlerService.getJobStats();
    }
    async listConfigs(page = '1', limit = '20') {
        return this.crawlerService.listConfigs(+page, +limit);
    }
    async getConfig(domain) {
        return this.crawlerService.getConfig(domain);
    }
    async deleteConfig(domain) {
        return this.crawlerService.deleteConfig(domain);
    }
    async listJobs(page = '1', limit = '20', domain) {
        return this.crawlerService.listJobs(+page, +limit, domain);
    }
};
exports.CrawlerController = CrawlerController;
__decorate([
    (0, common_1.Post)('scrape'),
    (0, common_1.UseGuards)(any_auth_guard_1.AnyAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiSecurity)('api-key'),
    (0, swagger_1.ApiOperation)({
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
    }),
    (0, swagger_1.ApiBody)({ type: ScrapeDto }),
    (0, swagger_1.ApiResponse)({
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
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL or AI config not set' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "scrapeProduct", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Aggregated scraping statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        schema: { example: { total: 150, success: 140, failed: 10, updated: 5, domains: 23 } },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('configs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'List saved domain configurations',
        description: 'Returns paginated list of AI-generated CSS selector configs per domain.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "listConfigs", null);
__decorate([
    (0, common_1.Get)('configs/:domain'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get CSS selector config for a specific domain' }),
    (0, swagger_1.ApiParam)({ name: 'domain', example: 'amazon.com.br' }),
    __param(0, (0, common_1.Param)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Delete)('configs/:domain'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete domain config',
        description: 'Removes the saved selectors for a domain. On the next scrape request the AI will regenerate them.',
    }),
    (0, swagger_1.ApiParam)({ name: 'domain', example: 'amazon.com.br' }),
    __param(0, (0, common_1.Param)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "deleteConfig", null);
__decorate([
    (0, common_1.Get)('jobs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'List scraping job history' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'domain', required: false, type: String, example: 'amazon.com.br' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "listJobs", null);
exports.CrawlerController = CrawlerController = __decorate([
    (0, swagger_1.ApiTags)('Crawler'),
    (0, common_1.Controller)('crawler'),
    __metadata("design:paramtypes", [crawler_service_1.CrawlerService])
], CrawlerController);
//# sourceMappingURL=crawler.controller.js.map