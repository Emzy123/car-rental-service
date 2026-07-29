import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../src/config/index.js', () => ({
  config: { clientUrl: 'http://localhost:5173' },
}));

const { resolveClientUrl } = await import('../src/utils/clientUrl.js');

function mockReq(headers = {}) {
  return {
    get(name) {
      return headers[name.toLowerCase()] ?? headers[name] ?? undefined;
    },
    protocol: headers.protocol || 'https',
  };
}

describe('resolveClientUrl', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('derives URL from Origin when CLIENT_URL is localhost', async () => {
    const { resolveClientUrl: resolve } = await import('../src/utils/clientUrl.js');
    const url = resolve(
      mockReq({ origin: 'https://drive-rent.vercel.app', protocol: 'https' })
    );
    expect(url).toBe('https://drive-rent.vercel.app');
  });

  it('derives URL from Referer when Origin is missing', async () => {
    const { resolveClientUrl: resolve } = await import('../src/utils/clientUrl.js');
    const url = resolve(
      mockReq({
        referer: 'https://drive-rent.vercel.app/dashboard/bookings/1/pay',
        protocol: 'https',
      })
    );
    expect(url).toBe('https://drive-rent.vercel.app');
  });

  it('derives URL from forwarded headers on serverless', async () => {
    const { resolveClientUrl: resolve } = await import('../src/utils/clientUrl.js');
    const url = resolve(
      mockReq({
        'x-forwarded-host': 'drive-rent.vercel.app',
        'x-forwarded-proto': 'https',
        protocol: 'https',
      })
    );
    expect(url).toBe('https://drive-rent.vercel.app');
  });

  it('falls back to localhost when no request hints exist', async () => {
    const { resolveClientUrl: resolve } = await import('../src/utils/clientUrl.js');
    expect(resolve(null)).toBe('http://localhost:5173');
  });
});
