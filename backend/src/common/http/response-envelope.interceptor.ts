import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildMeta } from './request-id';

/**
 * Wraps every successful controller return value in the frozen success
 * envelope: `{ data, meta: { requestId, generatedAt } }` (TEAM_CONVENTIONS §F).
 * Controllers return the bare `data` payload (object or array).
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        data: data ?? {},
        meta: buildMeta(),
      })),
    );
  }
}
