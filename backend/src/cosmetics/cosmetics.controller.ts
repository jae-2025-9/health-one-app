import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { CosmeticsService } from './cosmetics.service';
import { AnalyzeIngredientsDto } from './dto/analyze-ingredients.dto';
import { CreateCosmeticUsageDto } from './dto/create-cosmetic-usage.dto';

@Controller('cosmetics')
export class CosmeticsController {
  constructor(private readonly cosmetics: CosmeticsService) {}

  @Post('analyze-ingredients')
  @HttpCode(HttpStatus.OK)
  analyze(
    @CurrentUserId() userId: string,
    @Body() dto: AnalyzeIngredientsDto,
  ) {
    return this.cosmetics.analyzeIngredients(userId, dto);
  }

  @Post('usage-logs')
  @HttpCode(HttpStatus.CREATED)
  createUsage(
    @CurrentUserId() userId: string,
    @Body() dto: CreateCosmeticUsageDto,
  ) {
    return this.cosmetics.createUsageLog(userId, dto);
  }
}
