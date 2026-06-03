import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { IntakesService } from './intakes.service';
import { CreateIntakeItemDto } from './dto/create-intake-item.dto';
import { CreateIntakeLogDto } from './dto/create-intake-log.dto';

@Controller('intakes')
export class IntakesController {
  constructor(private readonly intakes: IntakesService) {}

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  createItem(
    @CurrentUserId() userId: string,
    @Body() dto: CreateIntakeItemDto,
  ) {
    return this.intakes.createItem(userId, dto);
  }

  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  createLog(@CurrentUserId() userId: string, @Body() dto: CreateIntakeLogDto) {
    return this.intakes.createLog(userId, dto);
  }

  @Get('schedule')
  getSchedule(
    @CurrentUserId() userId: string,
    @Query('date') date?: string,
  ) {
    return this.intakes.getSchedule(userId, date);
  }
}
