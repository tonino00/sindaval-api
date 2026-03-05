import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ReportsService } from '../reports/reports.service';

@ApiTags('admin')
@ApiCookieAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('health')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Health check admin' })
  healthCheck() {
    return {
      status: 'ok',
      message: 'Admin panel is running',
    };
  }

  @Get('dashboard/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas do dashboard (Admin)' })
  getDashboardStats() {
    return this.reportsService.getDashboard();
  }

  @Post('reports/export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Exportar relatórios (Admin)' })
  async exportReports(@Body() _body: any, @Res() res: Response) {
    const csv = await this.reportsService.exportCsv();
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=usuarios.csv');
    return res.send(csv);
  }

  @Get('reports/preview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Preview de relatórios (Admin)' })
  previewReports(@Query('tipo') tipo: string) {
    return this.reportsService.getPreview(tipo);
  }
}
