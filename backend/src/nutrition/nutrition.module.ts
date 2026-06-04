import { Module } from '@nestjs/common';
import { BeveragesController } from './beverages.controller';
import { MealsController } from './meals.controller';
import { NutritionService } from './nutrition.service';

@Module({
  controllers: [MealsController, BeveragesController],
  providers: [NutritionService],
})
export class NutritionModule {}
