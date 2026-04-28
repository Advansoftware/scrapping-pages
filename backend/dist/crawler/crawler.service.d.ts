import { Repository } from 'typeorm';
import { CrawlerConfig } from './entities/crawler-config.entity';
import { ScrapeJob } from './entities/scrape-job.entity';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
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
    installments: {
        times: string;
        value: string;
    } | null;
}
export declare class CrawlerService {
    private readonly configRepo;
    private readonly jobRepo;
    private readonly aiService;
    private readonly usersService;
    private readonly logger;
    constructor(configRepo: Repository<CrawlerConfig>, jobRepo: Repository<ScrapeJob>, aiService: AiService, usersService: UsersService);
    scrapeProduct(url: string, userId: number): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
        domain?: undefined;
        selectorsUpdated?: undefined;
        durationMs?: undefined;
    } | {
        success: boolean;
        data: ProductData;
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
    private _extractData;
    private _getFailedFields;
    listConfigs(page?: number, limit?: number): Promise<{
        configs: CrawlerConfig[];
        total: number;
        page: number;
        limit: number;
    }>;
    getConfig(domain: string): Promise<CrawlerConfig>;
    deleteConfig(domain: string): Promise<{
        message: string;
    }>;
    listJobs(page?: number, limit?: number, domain?: string): Promise<{
        jobs: ScrapeJob[];
        total: number;
        page: number;
        limit: number;
    }>;
    getJobStats(): Promise<{
        total: number;
        success: number;
        failed: number;
        updated: number;
        domains: number;
    }>;
}
