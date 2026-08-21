/** Lightweight, dependency-free user-agent summarizer — good enough for an audit trail's
 *  "Device" column without pulling in a full UA-parsing library. */
export function summarizeUserAgent(ua: string | null | undefined): string {
  if (!ua) return "—";

  let os = "Unknown OS";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone/i.test(ua)) os = "iPhone";
  else if (/ipad/i.test(ua)) os = "iPad";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser = "Unknown Browser";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/crios/i.test(ua)) browser = "Chrome";
  else if (/fxios/i.test(ua) || /firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && /version\//i.test(ua)) browser = "Safari";

  return `${browser} on ${os}`;
}
