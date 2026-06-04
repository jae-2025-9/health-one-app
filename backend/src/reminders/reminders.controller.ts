import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { PatchReminderDto } from './dto/patch-reminder.dto';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.reminders.list(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateReminderDto,
  ) {
    return this.reminders.create(userId, dto);
  }

  @Patch(':id')
  patch(
    @CurrentUserId() userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PatchReminderDto,
  ) {
    return this.reminders.patch(userId, id, dto);
  }
}
