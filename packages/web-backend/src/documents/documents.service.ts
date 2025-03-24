import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Document } from './document.interface';

@Injectable()
export class DocumentsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Document[]> {
    const docs = await this.db.query('SELECT * FROM documents') as { rows: Document[] };
    const relations = await this.db.query('SELECT parent_id, child_id FROM relations') as { rows: { parent_id: string; child_id: string }[] };

    const docMap = new Map<string, Document>();
    docs.rows.forEach(doc => {
      // Ensure doc.id exists before using it as a key
      if (!doc.id) {
        throw new HttpException('Document missing ID', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      doc.content = [];
      docMap.set(doc.id, doc);
    });

    relations.rows.forEach(rel => {
      const parent = docMap.get(rel.parent_id);
      const child = docMap.get(rel.child_id);
      if (parent && child) {
        parent.content!.push(child as Document);
        child.parent_id = rel.parent_id;
      }
    });

    return Array.from(docMap.values());
  }

  async create(document: Document) {
    const { title, position_x, position_y, box_width, box_height, box_padding, z_index, type, is_root } = document;
    const result = await this.db.query(`
      INSERT INTO documents (title, position_x, position_y, box_width, box_height, box_padding, z_index, type, is_root)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [title, position_x, position_y, box_width, box_height, box_padding, z_index, type, is_root]);

    return { success: true, document: result.rows[0] };
  }

  async update(id: string, updates: Partial<Document>) {
    const { id: _, ...cleanUpdates } = updates;
    const fields = Object.keys(cleanUpdates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [...Object.values(cleanUpdates), id];

    const result = await this.db.query(`
      UPDATE documents 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `, values);

    if (result.rowCount === 0) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    return { success: true, document: result.rows[0] };
  }

  async delete(id: string) {
    const result = await this.db.query(`
      DELETE FROM documents 
      WHERE id = $1
    `, [id]);

    if (result.rowCount === 0) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    return { success: true };
  }
}