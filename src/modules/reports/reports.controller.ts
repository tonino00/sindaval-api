import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('reports')
@ApiCookieAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.FINANCEIRO)
  @ApiOperation({ summary: 'Dashboard com estatísticas' })
  @ApiResponse({ status: 200, description: 'Estatísticas do sistema' })
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('export-csv')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Exportar usuários em CSV' })
  @ApiResponse({ status: 200, description: 'CSV gerado' })
  async exportCsv(@Res() res: Response) {
    const csv = await this.reportsService.exportCsv();
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=usuarios.csv');
    return res.send(csv);
  }
}
