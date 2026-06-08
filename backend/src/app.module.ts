import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './health.controller';
import { ActivitiesModule } from './activities/activities.module';
import { SleepRecordsModule } from './sleep-records/sleep-records.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { IntakesModule } from './intakes/intakes.module';
import { InteractionChecksModule } from './interaction-checks/interaction-checks.module';
import { CosmeticsModule } from './cosmetics/cosmetics.module';
import { RemindersModule } from './reminders/reminders.module';
import { ReportsModule } from './reports/reports.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    ActivitiesModule,
    SleepRecordsModule,
    NutritionModule,
    IntakesModule,
    InteractionChecksModule,
    CosmeticsModule,
    RemindersModule,
    ReportsModule,
    IntegrationsModule,
    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
