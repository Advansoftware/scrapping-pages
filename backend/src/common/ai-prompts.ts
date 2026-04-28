/**
 * Shared system prompt used by all AI providers.
 * Kept centralised so that behaviour is consistent across providers.
 */
export const SCRAPER_SYSTEM_PROMPT = `You are a CSS selector extractor. Your ONLY job is to output a single JSON object.

CRITICAL RULES — NEVER BREAK THESE:
1. Output ONLY the raw JSON object. No explanations. No markdown. No prose. No preamble.
2. If you write a single word outside of JSON, you have FAILED.
3. The JSON must contain exactly these 7 keys: title, salePrice, originalPrice, image, coupon, shipping, installments
4. Values must be valid CSS selectors (e.g. ".price-tag", "#productTitle", "h1.product-name")
5. Use JSON null (not the string "null") only when a field truly does not exist on the page
6. Prefer short, unique selectors: ".price" is better than "div > section > span.price"

EXAMPLE — this is the EXACT format you must follow:

Input HTML:
<body><h1 class="title">Product Name</h1><span class="sale-price">R\$99</span><span class="old-price">R\$199</span><img class="main-img" src="img.jpg"/><span class="shipping-text">Free shipping</span></body>

Your response (nothing before or after this JSON):
{"title":".title","salePrice":".sale-price","originalPrice":".old-price","image":".main-img","coupon":null,"shipping":".shipping-text","installments":null}

Now analyze the HTML in the user message and output ONLY the JSON object. Start your response with { and end with }.`;

/**
 * Extracts the most relevant HTML section for a product page.
 * Tries to find the main product container; falls back to body.
 * Removes noise (scripts, styles, nav, footer, ads) so the AI
 * receives clean, focused markup with actual CSS class names intact.
 */
export function extractBodyHtml(rawHtml: string, maxChars = 15000): string {
  let clean = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove navigation, footer, header, sidebar (not useful for product data)
    .replace(/<(nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove long data-* attribute values (JSON blobs, base64) but keep short ones (class hints)
    .replace(/(\s+data-[a-z][a-z0-9-]*)="[^"]{100,}"/gi, '')
    // Remove tracking event handlers
    .replace(/\s+(onclick|onload|onmouseover|onmouseout|onfocus|onblur)="[^"]*"/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/(\n\s*){3,}/g, '\n\n')
    .trim();

  // Try to extract only the body
  const bodyMatch = clean.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) clean = bodyMatch[1].trim();

  // Try to find the main product section
  const mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1].length > 500) {
    return mainMatch[1].trim().slice(0, maxChars);
  }

  // Fallback: look for common product container IDs/classes
  const productContainerRe = /<(div|section|article)[^>]*(?:id|class)="[^"]*(?:product|produto|pdp|item|detail|catalog)[^"]*"[^>]*>([\s\S]{200,})/i;
  const containerMatch = clean.match(productContainerRe);
  if (containerMatch) {
    return clean.slice(clean.indexOf(containerMatch[0]), clean.indexOf(containerMatch[0]) + maxChars);
  }

  return clean.slice(0, maxChars);
}

export function buildGeneratePrompt(html: string): string {
  const cleanHtml = extractBodyHtml(html);
  return `HTML:
${cleanHtml}

JSON:`;
}

export function buildUpdatePrompt(
  html: string,
  previousSelectors: Record<string, string>,
  failedFields: string[],
): string {
  const cleanHtml = extractBodyHtml(html);
  return `Failed fields (querySelector returned null): ${failedFields.join(', ')}

Previous selectors that did NOT work:
${JSON.stringify(previousSelectors, null, 2)}

Generate NEW and DIFFERENT selectors for the failed fields. Keep working selectors unchanged.
Output ONLY the updated JSON object.

HTML:
${cleanHtml}

JSON:`;
}

/** Strips markdown fences and extracts the first complete JSON object from the response */
export function cleanJsonResponse(raw: string): Record<string, string> {
  let clean = raw
    .trim()
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```json?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // fall through
  }

  // Extract JSON between first { and last }
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const parsed = JSON.parse(clean.slice(start, end + 1));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }

  console.warn('[cleanJsonResponse] Falha ao parsear resposta da IA. Raw (300 chars):', raw.slice(0, 300));
  return {};
}

/** Returns true if the selectors object has at least the minimum required fields */
export function hasValidSelectors(selectors: Record<string, string>): boolean {
  const required = ['title', 'salePrice', 'image'];
  return required.some((k) => selectors[k] && selectors[k] !== 'null');
}
