import { Module } from '@nestjs/common';
import { RelationsController } from './relations.controller';
import { RelationsService } from './relations.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RelationsController],
  providers: [RelationsService],
})
export class RelationsModule {}
