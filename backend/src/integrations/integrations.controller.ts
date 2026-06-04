import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { IntegrationsService } from './integrations.service';
import { HealthSyncRequestDto } from './dto/health-sync-request.dto';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Post('health-sync')
  @HttpCode(HttpStatus.ACCEPTED)
  healthSync(
    @CurrentUserId() userId: string,
    @Body() dto: HealthSyncRequestDto,
  ) {
    return this.integrations.healthSync(userId, dto);
  }
}
