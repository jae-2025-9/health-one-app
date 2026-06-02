import { Controller, Get } from '@nestjs/common';

/** Liveness probe. Returns the standard `{ data, meta }` envelope. */
@Controller('healthz')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', lane: 'L3', domain: 'meds/interaction/cosmetics' };
  }
}
