import { DEPLOYED_API_BASE, resolveApiBase } from '../lib/api-base.ts';

const cases: Array<{
  name: string;
  configured: string | undefined;
  nodeEnv: string;
  expected: string;
}> = [
  { name: 'unset', configured: undefined, nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'blank', configured: '   ', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'relative slash', configured: '/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'relative bare', configured: 'api/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'invalid protocol', configured: 'ftp://example.com/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'prod localhost', configured: 'http://localhost:3000/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'prod localhost https', configured: 'https://localhost:3000/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'prod 127.0.0.1', configured: 'http://127.0.0.1:3000/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'prod 127.0.0.2', configured: 'http://127.0.0.2:3000/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'prod ipv6 loopback', configured: 'http://[::1]:3000/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'prod zero host', configured: 'http://0.0.0.0:3000/v1', nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'dev localhost allowed', configured: 'http://localhost:3000/v1', nodeEnv: 'development', expected: 'http://localhost:3000/v1' },
  { name: 'valid render', configured: DEPLOYED_API_BASE, nodeEnv: 'production', expected: DEPLOYED_API_BASE },
  { name: 'valid custom https', configured: 'https://api.example.com/v1/', nodeEnv: 'production', expected: 'https://api.example.com/v1' },
];

for (const testCase of cases) {
  const actual = resolveApiBase(testCase.configured, testCase.nodeEnv);
  if (actual !== testCase.expected) {
    throw new Error(`${testCase.name}: expected ${testCase.expected}, got ${actual}`);
  }
}

console.log(`API base validation OK (${cases.length} cases)`);
