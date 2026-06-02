import { Module } from '@nestjs/common';
import { InteractionChecksController } from './interaction-checks.controller';
import { InteractionChecksService } from './interaction-checks.service';

@Module({
  controllers: [InteractionChecksController],
  providers: [InteractionChecksService],
})
export class InteractionChecksModule {}
