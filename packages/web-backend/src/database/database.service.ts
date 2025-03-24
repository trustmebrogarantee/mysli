import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg-pool';

@Injectable()
export class DatabaseService {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async initDatabase() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        position_x INTEGER NOT NULL,
        position_y INTEGER NOT NULL,
        box_width INTEGER NOT NULL,
        box_height INTEGER NOT NULL,
        box_padding INTEGER NOT NULL,
        z_index INTEGER NOT NULL,
        type TEXT NOT NULL,
        is_root BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS relations (
        parent_id TEXT,
        child_id TEXT,
        CONSTRAINT unique_relation UNIQUE (parent_id, child_id),
        FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (child_id) REFERENCES documents(id) ON DELETE CASCADE
      );
    `);

    const { rows } = await this.pool.query('SELECT COUNT(*) as count FROM documents');
    if (parseInt(rows[0].count) === 0) {
      await this.pool.query(`
        INSERT INTO documents (title, position_x, position_y, box_width, box_height, box_padding, z_index, type, is_root)
        VALUES 
          ('Root', 0, 0, 0, 0, 0, 0, 'root', TRUE)
        RETURNING id;
      `);
    }
  }
}
