let counter = 0;

/**
 * Trace-id in the team-fixed `req_YYYYMMDD_NNNN` format (TEAM_CONVENTIONS §E).
 * The counter is process-local and wraps at 10000 — good enough for a dev/trace id.
 */
export function generateRequestId(now: Date = new Date()): string {
  const yyyy = now.getFullYear().toString().padStart(4, '0');
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  counter = (counter % 9999) + 1;
  const seq = counter.toString().padStart(4, '0');
  return `req_${yyyy}${mm}${dd}_${seq}`;
}

export function buildMeta(now: Date = new Date()): {
  requestId: string;
  generatedAt: string;
} {
  return {
    requestId: generateRequestId(now),
    generatedAt: now.toISOString(),
  };
}
