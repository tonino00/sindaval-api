import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { DigitalCardService } from './digital-card.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('digital-card')
@ApiCookieAuth()
@Controller('digital-card')
export class DigitalCardController {
  constructor(private readonly digitalCardService: DigitalCardService) {}

  @Get('qrcode')
  @ApiOperation({ summary: 'Gerar QR Code da carteira digital' })
  @ApiResponse({ status: 200, description: 'QR Code gerado' })
  generateQRCode(@CurrentUser('id') userId: string) {
    return this.digitalCardService.generateQRCode(userId);
  }

  @Get('info')
  @ApiOperation({ summary: 'Informações da carteira digital' })
  @ApiResponse({ status: 200, description: 'Informações da carteira' })
  getCardInfo(@CurrentUser('id') userId: string) {
    return this.digitalCardService.getCardInfo(userId);
  }
}
