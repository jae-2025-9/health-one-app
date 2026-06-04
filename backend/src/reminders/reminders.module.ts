import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
  imports: [PrismaModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
