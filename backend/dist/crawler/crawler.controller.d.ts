import { CrawlerService } from './crawler.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
export declare class CrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    scrapeProduct(body: {
        url: string;
    }, user: RequestUser): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
        domain?: undefined;
        selectorsUpdated?: undefined;
        durationMs?: undefined;
    } | {
        success: boolean;
        data: import("./crawler.service").ProductData;
        domain: string;
        selectorsUpdated: boolean;
        durationMs: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        domain: string;
        durationMs: number;
        data?: undefined;
        selectorsUpdated?: undefined;
    }>;
    getStats(): Promise<{
        total: number;
        success: number;
        failed: number;
        updated: number;
        domains: number;
    }>;
    listConfigs(page?: string, limit?: string): Promise<{
        configs: import("./entities/crawler-config.entity").CrawlerConfig[];
        total: number;
        page: number;
        limit: number;
    }>;
    getConfig(domain: string): Promise<import("./entities/crawler-config.entity").CrawlerConfig>;
    deleteConfig(domain: string): Promise<{
        message: string;
    }>;
    listJobs(page?: string, limit?: string, domain?: string): Promise<{
        jobs: import("./entities/scrape-job.entity").ScrapeJob[];
        total: number;
        page: number;
        limit: number;
    }>;
}
