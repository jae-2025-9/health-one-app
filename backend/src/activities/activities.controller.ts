import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUserId() userId: string, @Body() dto: CreateActivityDto) {
    return this.activities.create(userId, dto);
  }

  @Get('summary')
  getSummary(@CurrentUserId() userId: string, @Query() query: DateRangeQueryDto) {
    return this.activities.getSummary(userId, query);
  }
}
