import { parse } from 'json5';

export function extractJsonBlock(markdown: string): any {
  const match = markdown.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) throw new Error("Не удалось найти JSON-блок в тексте");
  return parse(match[1]);
}