export function extractJson(response: string): any {
  if (!response) throw new Error('No response input');

  // Remove Markdown code fences like ```json or ```
  let cleaned = response.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.search(/[\{\[]/);
  if (start === -1) throw new Error('invalid');

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;

  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{' || char === '[') depth++;
      if (char === '}' || char === ']') depth--;

      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end === -1) throw new Error('invalid');

  const jsonString = cleaned.slice(start, end);

  return JSON.parse(jsonString);
}
