import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { CreateBeverageDto } from './dto/create-beverage.dto';
import { ImageAnalysisRequestDto } from './dto/image-analysis-request.dto';
import { NutritionService } from './nutrition.service';

@Controller('beverages')
export class BeveragesController {
  constructor(private readonly nutrition: NutritionService) {}

  @Post('analyze-label')
  @HttpCode(HttpStatus.OK)
  analyzeLabel(
    @CurrentUserId() userId: string,
    @Body() dto: ImageAnalysisRequestDto,
  ) {
    return this.nutrition.analyzeBeverageLabel(userId, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUserId() userId: string, @Body() dto: CreateBeverageDto) {
    return this.nutrition.createBeverage(userId, dto);
  }

  @Get('summary')
  getSummary(@CurrentUserId() userId: string, @Query() query: DateRangeQueryDto) {
    return this.nutrition.getBeverageSummary(userId, query);
  }
}
