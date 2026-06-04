import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { CreateSleepRecordDto } from './dto/create-sleep-record.dto';
import { SleepRecordsService } from './sleep-records.service';

@Controller('sleep-records')
export class SleepRecordsController {
  constructor(private readonly sleepRecords: SleepRecordsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUserId() userId: string, @Body() dto: CreateSleepRecordDto) {
    return this.sleepRecords.create(userId, dto);
  }

  @Get('summary')
  getSummary(@CurrentUserId() userId: string, @Query() query: DateRangeQueryDto) {
    return this.sleepRecords.getSummary(userId, query);
  }
}
