import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './health.controller';
import { ActivitiesModule } from './activities/activities.module';
import { SleepRecordsModule } from './sleep-records/sleep-records.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { IntakesModule } from './intakes/intakes.module';
import { InteractionChecksModule } from './interaction-checks/interaction-checks.module';
import { CosmeticsModule } from './cosmetics/cosmetics.module';

@Module({
  imports: [
    PrismaModule,
    ActivitiesModule,
    SleepRecordsModule,
    NutritionModule,
    IntakesModule,
    InteractionChecksModule,
    CosmeticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
