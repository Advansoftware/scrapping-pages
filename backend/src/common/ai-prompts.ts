/**
 * Shared system prompt used by all AI providers.
 * Kept centralised so that behaviour is consistent across providers.
 */
export const SCRAPER_SYSTEM_PROMPT = `You are an HTML structure analyzer that extracts CSS SELECTORS for product fields.

A CSS SELECTOR is the class or id path used to locate an HTML element — like ".price-box" or "h1.product-name".
It is NOT the text content or value inside the element.

WRONG output (returning actual product data — this is forbidden):
{"title":"Blue Widget Pro","salePrice":"R$49,90","image":"https://img.jpg","originalPrice":null,"coupon":null,"shipping":null,"installments":null}

CORRECT output (returning CSS selectors that point to the elements):
{"title":".product-title","salePrice":".sale-price","image":".main-photo","originalPrice":".old-price","coupon":null,"shipping":".shipping-tag","installments":null}

RULES:
1. Output ONLY the JSON object — no text, no markdown, no explanation before or after.
2. The JSON must have EXACTLY these 7 keys: title, salePrice, originalPrice, image, coupon, shipping, installments
3. Each value must be a CSS selector string (e.g. ".classname", "#id", "h1.class") or JSON null.
4. null means the field does not exist in the HTML. Never use the string "null".
5. Start your response with { and end with }.

EXAMPLE:
HTML: <section class="pdp"><h1 class="pdp-title">Blue Widget</h1><div class="price-block"><span class="price-sale">R$49</span><span class="price-list">R$99</span></div><img class="pdp-photo" src="img.jpg"/><span class="ship-tag">Frete grátis</span><span class="coupon-badge">5% OFF</span></section>
JSON: {"title":".pdp-title","salePrice":".price-sale","originalPrice":".price-list","image":".pdp-photo","coupon":".coupon-badge","shipping":".ship-tag","installments":null}

Now analyze the HTML below and output ONLY the JSON with CSS selectors:`;

/**
 * Extracts the most relevant HTML section for a product page.
 * Strips ALL attributes except class, id and src (img) so that the
 * DOM structure is much more compact — enabling us to fit far more
 * meaningful markup within the character budget.
 */
export function extractBodyHtml(rawHtml: string, maxChars = 20000): string {
  let clean = rawHtml
    // Remove entire noise blocks
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Strip ALL tag attributes, keeping only class, id (and src for img)
    .replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)\s*\/?>/g, (_, tag: string, attrs: string) => {
      if (!attrs || !attrs.trim()) return `<${tag}>`;
      const classM = attrs.match(/\bclass="([^"]*)"/i);
      const idM = attrs.match(/\bid="([^"]*)"/i);
      const srcM = tag.toLowerCase() === 'img' ? attrs.match(/\bsrc="([^"]*)"/i) : null;
      const keep: string[] = [];
      if (classM) keep.push(`class="${classM[1]}"`);
      if (idM) keep.push(`id="${idM[1]}"`);
      if (srcM) keep.push(`src="${srcM[1]}"`);
      return keep.length ? `<${tag} ${keep.join(' ')}>` : `<${tag}>`;
    })
    // Collapse whitespace
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/(\n\s*){3,}/g, '\n\n')
    .trim();

  // Extract body content only
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
  return `HTML (extract CSS selectors, NOT the data values):
${cleanHtml}

JSON (CSS selectors only):`;
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
