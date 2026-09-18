/**
 * Affiliate destinations, served through /go/<partner> so a link can be
 * changed in one place and every click is counted in the activity log.
 *
 * Hostinger's affiliate agreement allows this only because dnspreviewer.com
 * is listed in the affiliate profile: it bans cloaking "with the goal to
 * promote Hostinger on websites and/or networks not explicitly listed in
 * your affiliate profile". Keep it listed there.
 */
export const AFFILIATES = {
  hostinger: {
    url: "https://www.hostg.xyz/SHEv8",
    // Personal code issued to Romail by Hostinger. The agreement forbids
    // offering discount codes without Hostinger's approval, so only ever
    // show a code Hostinger itself issued.
    coupon: "ROMAILSHAH",
  },
} as const;

export type AffiliatePartner = keyof typeof AFFILIATES;

export function isAffiliatePartner(p: string): p is AffiliatePartner {
  return Object.prototype.hasOwnProperty.call(AFFILIATES, p);
}
