/** Existing `customers` row fields that an unauthenticated claim form must not clobber. */
export type ExistingCustomerPii = {
  full_name: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
};

export type ClaimFormPii = {
  fullName: string;
  phone: string | null;
  address: string;
  email: string | null;
};

function empty(value: string | null | undefined): boolean {
  return !value?.trim();
}

/**
 * Fill blanks only. Claim links are capability URLs for one order — they must
 * not rewrite another customer's name, phone, address, or email.
 */
export function claimPatchForExistingCustomer(
  existing: ExistingCustomerPii,
  claim: ClaimFormPii
): Partial<ExistingCustomerPii> {
  const patch: Partial<ExistingCustomerPii> = {};
  const name = claim.fullName.trim();
  const addr = claim.address.trim();
  if (empty(existing.full_name) && name) patch.full_name = name;
  if (empty(existing.phone) && claim.phone) patch.phone = claim.phone;
  if (empty(existing.address) && addr) patch.address = addr;
  if (empty(existing.email) && claim.email) patch.email = claim.email;
  return patch;
}

export function hasCustomerPiiPatch(patch: Partial<ExistingCustomerPii>): boolean {
  return Object.keys(patch).length > 0;
}
