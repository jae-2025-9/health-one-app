import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { AiService } from './ai.service';
import { CreateAiQuestionDto } from './dto/create-ai-question.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('questions')
  @HttpCode(HttpStatus.OK)
  ask(
    @CurrentUserId() userId: string,
    @Body() dto: CreateAiQuestionDto,
    @Req() req: Request,
  ) {
    return this.ai.ask(userId, dto, aiRateLimitSubject(req));
  }
}

function aiRateLimitSubject(req: Request): string {
  return `ip:${req.ip ?? req.socket.remoteAddress ?? 'unknown'}`;
}
