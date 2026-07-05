export function resolvePosCustomerProfileId(customerId: string | null | undefined): number | null {
  const raw = customerId?.trim();
  if (!raw) return null;

  const idText = /^\d+$/.test(raw) ? raw : raw.match(/^pos-(\d+)$/i)?.[1];
  if (!idText) return null;

  const id = Number(idText);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
