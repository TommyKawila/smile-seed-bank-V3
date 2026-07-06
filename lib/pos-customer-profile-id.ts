export function parsePosCustomerProfileId(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== "string") return null;

  const raw = value.trim();
  const match = raw.match(/^(?:pos-)?([1-9]\d*)$/);
  if (!match) return null;

  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}
