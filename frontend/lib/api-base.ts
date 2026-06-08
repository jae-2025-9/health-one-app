export const DEPLOYED_API_BASE = 'https://health-one-api.onrender.com/v1';

export function resolveApiBase(
  configured = process.env.NEXT_PUBLIC_API_URL,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  const candidate = configured?.trim();
  if (!candidate) return DEPLOYED_API_BASE;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return DEPLOYED_API_BASE;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[(.*)\]$/, '$1');
  const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  const isLoopback =
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname === '::1' ||
    hostname === '0:0:0:0:0:0:0:1' ||
    hostname === '0.0.0.0';
  if (!isHttp || (isLoopback && nodeEnv !== 'development')) {
    return DEPLOYED_API_BASE;
  }

  return parsed.toString().replace(/\/$/, '');
}
