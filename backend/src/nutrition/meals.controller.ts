import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/auth/current-user.decorator';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { CreateMealDto } from './dto/create-meal.dto';
import { ImageAnalysisRequestDto } from './dto/image-analysis-request.dto';
import { NutritionService } from './nutrition.service';

@Controller('meals')
export class MealsController {
  constructor(private readonly nutrition: NutritionService) {}

  @Post('analyze-image')
  @HttpCode(HttpStatus.OK)
  analyzeImage(
    @CurrentUserId() userId: string,
    @Body() dto: ImageAnalysisRequestDto,
  ) {
    return this.nutrition.analyzeMealImage(userId, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUserId() userId: string, @Body() dto: CreateMealDto) {
    return this.nutrition.createMeal(userId, dto);
  }

  @Get()
  list(@CurrentUserId() userId: string, @Query() query: DateRangeQueryDto) {
    return this.nutrition.listMeals(userId, query);
  }
}
