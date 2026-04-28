export declare enum ScrapeJobStatus {
    PENDING = "pending",
    RUNNING = "running",
    SUCCESS = "success",
    FAILED = "failed"
}
export declare class ScrapeJob {
    id: number;
    url: string;
    domain: string;
    status: ScrapeJobStatus;
    result: Record<string, any>;
    selectorsUpdated: boolean;
    error: string;
    durationMs: number;
    createdAt: Date;
}
