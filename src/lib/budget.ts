const DEFAULT_MAX_SESSION_COST = 2;

const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-3-5-sonnet-latest": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 }
};

let sessionCostUsd = 0;

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export interface CostUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens = 0,
  cacheReadTokens = 0
): number {
  const rates = PRICING[model] ?? PRICING["claude-sonnet-4-6"];
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * rates.input * 1.25;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * rates.input * 0.1;
  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

export function recordUsageCost(model: string, usage: CostUsage | undefined): number {
  const added = calculateCost(
    model,
    usage?.input_tokens ?? 0,
    usage?.output_tokens ?? 0,
    usage?.cache_creation_input_tokens ?? 0,
    usage?.cache_read_input_tokens ?? 0
  );

  sessionCostUsd += added;
  return added;
}

export function checkBudget(agentName: string): void {
  const maxSessionCost = Number.parseFloat(
    process.env.MAX_SESSION_COST ?? String(DEFAULT_MAX_SESSION_COST)
  );

  if (!Number.isFinite(maxSessionCost) || maxSessionCost <= 0) {
    return;
  }

  if (sessionCostUsd >= maxSessionCost) {
    throw new BudgetExceededError(
      `Budget limit reached before running ${agentName}. Session total $${sessionCostUsd.toFixed(3)} exceeds MAX_SESSION_COST=$${maxSessionCost.toFixed(2)}.`
    );
  }
}

export function getSessionCostUsd(): number {
  return sessionCostUsd;
}
