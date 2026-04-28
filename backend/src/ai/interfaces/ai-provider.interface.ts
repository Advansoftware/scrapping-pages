/**
 * Common interface that every AI provider must implement.
 * Allows the rest of the application to be provider-agnostic.
 */
export interface IAiProvider {
  /**
   * Analyses HTML and returns a map of field names to CSS selectors.
   * @param html Raw page HTML (will be trimmed to safe token length internally)
   */
  generateSelectors(html: string): Promise<Record<string, string>>;

  /**
   * Re-generates selectors after a previous set failed to extract data.
   * @param html       Current page HTML
   * @param previous   Selectors that failed
   * @param failed     Names of the fields that returned null/empty
   */
  updateSelectorsAfterFailure(
    html: string,
    previous: Record<string, string>,
    failed: string[],
  ): Promise<Record<string, string>>;
}
