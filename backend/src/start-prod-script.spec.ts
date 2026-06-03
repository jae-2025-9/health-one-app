import { readFileSync } from 'fs';
import { join } from 'path';

describe('production start script', () => {
  it('points at the Nest build entrypoint emitted by npm run build', () => {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts['start:prod']).toBe('node dist/src/main.js');
  });
});
