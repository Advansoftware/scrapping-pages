export declare class CrawlerConfig {
    id: number;
    domain: string;
    selectors: Record<string, string>;
    version: number;
    failCount: number;
    lastTestedAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
