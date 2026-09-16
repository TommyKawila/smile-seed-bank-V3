import {
  claimPatchForExistingCustomer,
  hasCustomerPiiPatch,
} from "../lib/claim-customer-profile-merge";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const victim = {
  full_name: "Alice Victim",
  phone: "0811111111",
  address: "123 Real St, Chiang Mai",
  email: "alice@example.com",
};

const attackerClaim = {
  fullName: "Eve Attacker",
  phone: "0899999999",
  address: "999 Evil Rd",
  email: "alice@example.com",
};

const clobber = claimPatchForExistingCustomer(victim, attackerClaim);
assert(
  !hasCustomerPiiPatch(clobber),
  `claim form must not rewrite a filled customer profile, got ${JSON.stringify(clobber)}`
);

const blank = {
  full_name: null,
  phone: null,
  address: null,
  email: null,
};
const fill = claimPatchForExistingCustomer(blank, attackerClaim);
assert(fill.full_name === "Eve Attacker", "should fill empty name");
assert(fill.phone === "0899999999", "should fill empty phone");
assert(fill.address === "999 Evil Rd", "should fill empty address");
assert(fill.email === "alice@example.com", "should fill empty email");

const keepEmail = claimPatchForExistingCustomer(
  { ...blank, email: "alice@example.com" },
  { ...attackerClaim, email: "eve@evil.example" }
);
assert(keepEmail.email === undefined, "must never change an existing email");
assert(keepEmail.full_name === "Eve Attacker", "may still fill empty name");

console.log("assert-claim-associate-no-pii-clobber: ok");
