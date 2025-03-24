import { Module } from '@nestjs/common';
import { DocumentsModule } from './documents/documents.module';
import { RelationsModule } from './relations/relations.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DocumentsModule, RelationsModule, DatabaseModule],
})
export class AppModule {}
