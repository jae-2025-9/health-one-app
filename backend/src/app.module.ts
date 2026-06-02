import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthController } from './health.controller';
import { IntakesModule } from './intakes/intakes.module';
import { InteractionChecksModule } from './interaction-checks/interaction-checks.module';
import { CosmeticsModule } from './cosmetics/cosmetics.module';

@Module({
  imports: [
    PrismaModule,
    IntakesModule,
    InteractionChecksModule,
    CosmeticsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
