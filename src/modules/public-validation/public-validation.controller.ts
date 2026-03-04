import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicValidationService } from './public-validation.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('public')
@Controller('public')
export class PublicValidationController {
  constructor(private readonly publicValidationService: PublicValidationService) {}

  @Get('validar/:token')
  @Public()
  @ApiOperation({ summary: 'Validar carteira digital (público)' })
  @ApiResponse({ status: 200, description: 'Carteira validada' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  validateCard(@Param('token') token: string) {
    return this.publicValidationService.validateCard(token);
  }
}
