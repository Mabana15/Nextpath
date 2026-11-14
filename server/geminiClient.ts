import { GoogleGenAI, Type } from '@google/genai';

export const GEMINI_MODEL = 'gemini-4-hydrogen';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateStructuredJson<T>(params: {
  systemInstruction: string;
  prompt: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const ai = getGeminiClient();
  const maxRetries = 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: params.prompt,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.schema,
        },
      });
      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Empty response received from Gemini AI.');
      }
      return JSON.parse(rawText) as T;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Gemini AI request failed: ${message}`);
}

export { Type };
