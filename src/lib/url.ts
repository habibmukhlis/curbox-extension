export interface SiteLocation {
  domain: string;
  path: string;
}

const SKIP_PROTOCOLS = ["chrome:", "chrome-extension:", "about:", "moz-extension:", "edge:", "file:", "view-source:"];

export function parseLocation(rawUrl: string): SiteLocation | null {
  try {
    const url = new URL(rawUrl);
    if (SKIP_PROTOCOLS.includes(url.protocol)) return null;
    // The trailing dot form of a hostname ("youtube.com.") is the same site
    // and must not split its stats into a second domain.
    const domain = url.hostname.replace(/^www\./, "").replace(/\.$/, "");
    if (!domain) return null;
    const pathname = url.pathname === "/" ? "" : url.pathname;
    return { domain, path: `${pathname}${url.search}${url.hash}` };
  } catch {
    return null;
  }
}

export function domainMatches(target: string, rule: string): boolean {
  const t = target.toLowerCase();
  const r = rule.toLowerCase().replace(/^www\./, "");
  return t === r || t.endsWith(`.${r}`);
}
