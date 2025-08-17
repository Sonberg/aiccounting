import { log } from 'console';
import { secret } from 'encore.dev/config';
import OpenAI from 'openai';

export const client = new OpenAI({ apiKey: secret('OPEN_AI_KEY')() });

export async function summarizeIfLarge(
  label: string,
  data: unknown,
  maxTokens: number = 2000
) {
  const jsonStr = JSON.stringify(data);
  // Enkel "storlekstest" - här kan du även räkna tokens med en tokeniserare
  if (jsonStr.length) {
    return jsonStr;
  }

  log(`Summarizing ${label} because it's too large (${jsonStr.length} chars)`);

  const summaryPrompt = `
    You are a data compressor. Given JSON ${label}, extract only the fields that
    can help identify matches by:
    - payment reference / OCR
    - description / text
    - amount
    - date

    Keep it as compact JSON, removing unrelated fields.
    Input JSON:
    ${jsonStr}
  `;

  const summaryResponse = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: summaryPrompt,
    temperature: 0,
  });

  const summaryText = summaryResponse.output_text || '[]';
  log(`Summary of ${label}: ${summaryText.substring(0, 300)}...`);
  return summaryText;
}
