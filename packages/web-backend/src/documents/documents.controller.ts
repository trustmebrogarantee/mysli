import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { Document } from './document.interface';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll() {
    return this.documentsService.findAll();
  }

  @Post()
  async create(@Body() document: Document) {
    if (!document.title) {
      throw new HttpException('Missing title', HttpStatus.BAD_REQUEST);
    }
    return this.documentsService.create(document);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updates: Partial<Document>) {
    if (!id) {
      throw new HttpException('Missing document ID', HttpStatus.BAD_REQUEST);
    }
    if (Object.keys(updates).length === 0) {
      throw new HttpException('No fields to update', HttpStatus.BAD_REQUEST);
    }
    return this.documentsService.update(id, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    if (!id) {
      throw new HttpException('Missing document ID', HttpStatus.BAD_REQUEST);
    }
    return this.documentsService.delete(id);
  }
}
