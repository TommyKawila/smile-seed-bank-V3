/**
 * Genome Circle / membership dashboard on /profile. Default off for production UX.
 * Enable publicly: NEXT_PUBLIC_SHOW_MEMBERSHIP_PROGRAM=true
 * Admins (user_metadata.role === "ADMIN") always see the section for QA.
 */
export const SHOW_MEMBERSHIP_PROGRAM =
  process.env.NEXT_PUBLIC_SHOW_MEMBERSHIP_PROGRAM === "true";

export function canViewMembershipProgram(isAdmin: boolean): boolean {
  return SHOW_MEMBERSHIP_PROGRAM || isAdmin;
}
