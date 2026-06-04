import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('daily')
  daily(
    @CurrentUserId() userId: string,
    @Query('date') date?: string,
  ) {
    return this.reports.daily(userId, date);
  }

  @Get('weekly')
  weekly(
    @CurrentUserId() userId: string,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.reports.weekly(userId, weekStart);
  }
}
