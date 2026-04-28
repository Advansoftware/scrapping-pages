/**
 * Shared system prompt used by all AI providers.
 * Kept centralised so that behaviour is consistent across providers.
 */
export const SCRAPER_SYSTEM_PROMPT = `Você é um especialista em web scraping.
Analise o HTML de uma página de produto e retorne SOMENTE um JSON válido com os
seletores CSS para extrair as informações pedidas.
Nunca retorne texto fora do JSON. Não use markdown (sem \`\`\`json).

Formato esperado:
{
  "title": "seletor CSS para o título do produto",
  "salePrice": "seletor CSS para o preço promocional",
  "originalPrice": "seletor CSS para o preço original/riscado",
  "image": "seletor CSS para a imagem principal",
  "coupon": "seletor CSS para cupom de desconto (null se não existir)",
  "shipping": "seletor CSS para informações de frete",
  "installments": "seletor CSS para parcelamento",
  "notes": "observações relevantes sobre como extrair cada campo"
}`;

export function buildGeneratePrompt(html: string): string {
  return `Analise este HTML de uma página de produto e gere os seletores CSS para extrair os dados.
Retorne SOMENTE o JSON, sem markdown ou texto adicional.

HTML:
${html.slice(0, 15000)}`;
}

export function buildUpdatePrompt(
  html: string,
  previousSelectors: Record<string, string>,
  failedFields: string[],
): string {
  return `Os seguintes seletores FALHARAM ao extrair dados: ${failedFields.join(', ')}

Seletores anteriores que não funcionaram mais:
${JSON.stringify(previousSelectors, null, 2)}

Analise o novo HTML e gere seletores atualizados.
Retorne SOMENTE o JSON atualizado, sem markdown.

HTML:
${html.slice(0, 15000)}`;
}

/** Strips markdown fences and extracts the first complete JSON object from the response */
export function cleanJsonResponse(raw: string): Record<string, string> {
  // Remove markdown code fences
  let clean = raw
    .trim()
    .replace(/^```json?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(clean);
  } catch {
    // Extract JSON between first { and last }
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
    // Return empty object so the crawler continues gracefully
    return {};
  }
}
