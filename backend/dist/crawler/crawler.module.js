"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crawler_controller_1 = require("./crawler.controller");
const crawler_service_1 = require("./crawler.service");
const crawler_config_entity_1 = require("./entities/crawler-config.entity");
const scrape_job_entity_1 = require("./entities/scrape-job.entity");
const ai_module_1 = require("../ai/ai.module");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
let CrawlerModule = class CrawlerModule {
};
exports.CrawlerModule = CrawlerModule;
exports.CrawlerModule = CrawlerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([crawler_config_entity_1.CrawlerConfig, scrape_job_entity_1.ScrapeJob]),
            ai_module_1.AiModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
        ],
        controllers: [crawler_controller_1.CrawlerController],
        providers: [crawler_service_1.CrawlerService],
    })
], CrawlerModule);
//# sourceMappingURL=crawler.module.js.map