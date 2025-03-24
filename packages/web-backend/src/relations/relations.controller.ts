import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { RelationsService } from './relations.service';

@Controller('relations')
export class RelationsController {
  constructor(private readonly relationsService: RelationsService) {}

  @Put()
  async updateRelation(@Body() body: { nodeId: string; newParentId?: string }) {
    if (!body.nodeId) {
      throw new HttpException('Missing nodeId', HttpStatus.BAD_REQUEST);
    }
    return this.relationsService.updateRelation(body.nodeId, body.newParentId);
  }
}
