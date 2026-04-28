export interface IAiProvider {
    generateSelectors(html: string): Promise<Record<string, string>>;
    updateSelectorsAfterFailure(html: string, previous: Record<string, string>, failed: string[]): Promise<Record<string, string>>;
}
