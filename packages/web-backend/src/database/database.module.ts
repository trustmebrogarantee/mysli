import * as Pool from 'pg-pool';
import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: () => {
        console.log('POOL', Pool);
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nuxt_db',
        });
        return pool;
      },
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {
  constructor(private readonly dbService: DatabaseService) {
    this.dbService.initDatabase().catch(err => 
      console.error('Database initialization failed:', err)
    );
  }
}