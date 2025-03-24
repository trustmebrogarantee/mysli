import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RelationsService {
  constructor(private readonly db: DatabaseService) {}

  async updateRelation(nodeId: string, newParentId?: string) {
    try {
      await this.db.query('BEGIN');

      const nodeCheck = await this.db.query('SELECT id FROM documents WHERE id = $1', [nodeId]);
      if (nodeCheck.rowCount === 0) {
        throw new Error('Node document does not exist');
      }

      if (newParentId) {
        const parentCheck = await this.db.query('SELECT id FROM documents WHERE id = $1', [newParentId]);
        if (parentCheck.rowCount === 0) {
          throw new Error('Parent document does not exist');
        }
      }

      await this.db.query('DELETE FROM relations WHERE child_id = $1', [nodeId]);

      if (newParentId) {
        const cycleCheck = await this.db.query(`
          WITH RECURSIVE tree AS (
            SELECT child_id FROM relations WHERE parent_id = $1
            UNION ALL
            SELECT r.child_id FROM relations r
            JOIN tree t ON r.parent_id = t.child_id
          )
          SELECT COUNT(*) as count FROM tree WHERE child_id = $2
        `, [newParentId, nodeId]);

        if (parseInt(cycleCheck.rows[0].count) > 0) {
          throw new Error('Cyclic dependency detected');
        }

        await this.db.query('INSERT INTO relations (parent_id, child_id) VALUES ($1, $2)', [newParentId, nodeId]);
      }

      await this.db.query('COMMIT');
      return { success: true, nodeId, newParentId };
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw new HttpException(
        (error as Error).message || 'Invalid move operation',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}