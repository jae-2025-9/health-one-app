import { buildMeta, generateRequestId } from './request-id';

describe('generateRequestId', () => {
  it('matches the team-fixed req_YYYYMMDD_NNNN format', () => {
    const id = generateRequestId(new Date('2026-05-25T10:00:00+09:00'));
    expect(id).toMatch(/^req_\d{8}_\d{4}$/);
  });

  it('increments the sequence on each call', () => {
    const fixed = new Date('2026-05-25T10:00:00Z');
    const a = generateRequestId(fixed);
    const b = generateRequestId(fixed);
    expect(a).not.toEqual(b);
  });
});

describe('buildMeta', () => {
  it('produces requestId + ISO generatedAt', () => {
    const meta = buildMeta(new Date('2026-05-25T01:00:00Z'));
    expect(meta.requestId).toMatch(/^req_\d{8}_\d{4}$/);
    expect(meta.generatedAt).toBe('2026-05-25T01:00:00.000Z');
  });
});
