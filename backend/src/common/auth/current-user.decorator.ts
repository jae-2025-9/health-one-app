import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const DEV_USER_ID =
  process.env.DEV_USER_ID ?? '00000000-0000-0000-0000-000000000001';

/**
 * Resolves the acting user id.
 *
 * STUB: L1 owns real JWT auth. Until that lands, L3 reads `X-User-Id` from the
 * request header (so tests/clients can act as any seeded user) and falls back to
 * DEV_USER_ID. The contract surface (a `userId` string) is what L1 will provide,
 * so swapping in the real guard later requires no controller/service changes.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.header('x-user-id');
    return header && header.length > 0 ? header : DEV_USER_ID;
  },
);
