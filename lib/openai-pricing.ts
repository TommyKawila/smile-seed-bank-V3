/** USD per 1M tokens — update manually when OpenAI pricing changes. */
export const OPENAI_PRICE_PER_1M: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
};

export function estimateOpenAiCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = OPENAI_PRICE_PER_1M[model] ?? OPENAI_PRICE_PER_1M["gpt-4o-mini"];
  const cost =
    (promptTokens / 1_000_000) * rates.input +
    (completionTokens / 1_000_000) * rates.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
