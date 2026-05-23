/** PSI / SSR hint — desktop user agents skip eager mobile hero fetch. */
export function isLikelyDesktopUserAgent(userAgent: string): boolean {
  return !/Mobile|Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}
