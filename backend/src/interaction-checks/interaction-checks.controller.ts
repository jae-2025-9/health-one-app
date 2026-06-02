import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { InteractionChecksService } from './interaction-checks.service';
import { CreateInteractionCheckDto } from './dto/create-interaction-check.dto';

@Controller('interaction-checks')
export class InteractionChecksController {
  constructor(private readonly service: InteractionChecksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateInteractionCheckDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(userId, id);
  }
}
