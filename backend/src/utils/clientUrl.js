import { config } from '../config/index.js';

const LOCALHOST_RE = /localhost|127\.0\.0\.1/;

function normalizeUrl(url) {
  return url.replace(/\/$/, '');
}

function originFromReferer(referer) {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/**
 * Public frontend base URL for redirects (Paystack callback, emails, etc.).
 * Prefers a non-localhost CLIENT_URL; otherwise derives from the incoming request.
 */
export function resolveClientUrl(req) {
  const configuredOrigins = config.clientUrl
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  const publicConfigured = configuredOrigins.find((url) => !LOCALHOST_RE.test(url));
  if (publicConfigured) {
    return normalizeUrl(publicConfigured);
  }

  if (req) {
    const origin = req.get('origin');
    if (origin && !LOCALHOST_RE.test(origin)) {
      return normalizeUrl(origin);
    }

    const refererOrigin = originFromReferer(req.get('referer'));
    if (refererOrigin && !LOCALHOST_RE.test(refererOrigin)) {
      return normalizeUrl(refererOrigin);
    }

    const forwardedHost = req.get('x-forwarded-host');
    if (forwardedHost && !LOCALHOST_RE.test(forwardedHost)) {
      const host = forwardedHost.split(',')[0].trim();
      const protocol = (req.get('x-forwarded-proto') || req.protocol || 'https')
        .split(',')[0]
        .trim();
      return normalizeUrl(`${protocol}://${host}`);
    }

    const host = req.get('host');
    if (host && !LOCALHOST_RE.test(host)) {
      const protocol = req.protocol || 'https';
      return normalizeUrl(`${protocol}://${host}`);
    }
  }

  return normalizeUrl(configuredOrigins[0] || 'http://localhost:5173');
}
