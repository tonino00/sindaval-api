import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Agreement } from '../agreements/entities/agreement.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { UserNotification } from '../notifications/entities/user-notification.entity';
import { UserStatus } from '../../common/enums/user-status.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Agreement)
    private agreementRepository: Repository<Agreement>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>,
  ) {}

  private static getPtBrMonthLabel(monthIndex0Based: number): string {
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return labels[monthIndex0Based] ?? '';
  }

  private async getPagamentosMensais(quantidadeMeses = 6): Promise<Array<{ month: string; pix: number; cartao: number }>> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (quantidadeMeses - 1), 1);
    const endExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const rows = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('EXTRACT(YEAR FROM payment.created_at)', 'year')
      .addSelect('EXTRACT(MONTH FROM payment.created_at)', 'month')
      .addSelect('payment.metodo', 'metodo')
      .addSelect('COUNT(*)', 'count')
      .where('payment.status = :status', { status: PaymentStatus.APROVADO })
      .andWhere('payment.metodo IN (:...metodos)', { metodos: [PaymentMethod.PIX, PaymentMethod.CARTAO] })
      .andWhere('payment.created_at >= :start', { start })
      .andWhere('payment.created_at < :endExclusive', { endExclusive })
      .groupBy('year')
      .addGroupBy('month')
      .addGroupBy('payment.metodo')
      .getRawMany<{ year: string; month: string; metodo: PaymentMethod; count: string }>();

    const keyToCounts = new Map<string, { pix: number; cartao: number }>();
    for (const row of rows) {
      const year = Number(row.year);
      const month1Based = Number(row.month);
      const key = `${year}-${String(month1Based).padStart(2, '0')}`;
      const current = keyToCounts.get(key) ?? { pix: 0, cartao: 0 };
      const count = Number(row.count) || 0;
      if (row.metodo === PaymentMethod.PIX) current.pix += count;
      if (row.metodo === PaymentMethod.CARTAO) current.cartao += count;
      keyToCounts.set(key, current);
    }

    const result: Array<{ month: string; pix: number; cartao: number }> = [];
    for (let i = quantidadeMeses - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month1Based = d.getMonth() + 1;
      const key = `${year}-${String(month1Based).padStart(2, '0')}`;
      const counts = keyToCounts.get(key) ?? { pix: 0, cartao: 0 };

      result.push({
        month: ReportsService.getPtBrMonthLabel(d.getMonth()),
        pix: counts.pix,
        cartao: counts.cartao,
      });
    }

    return result;
  }

  async getDashboard() {
    const totalSindicalizados = await this.userRepository.count();
    const totalInadimplentes = await this.userRepository.count({
      where: { status: UserStatus.INADIMPLENTE },
    });
    const totalAtivos = await this.userRepository.count({
      where: { status: UserStatus.ATIVO },
    });

    const pagamentosPix = await this.paymentRepository.count({
      where: { metodo: PaymentMethod.PIX, status: PaymentStatus.APROVADO },
    });
    const pagamentosCartao = await this.paymentRepository.count({
      where: { metodo: PaymentMethod.CARTAO, status: PaymentStatus.APROVADO },
    });

    const percentualAdimplencia = totalSindicalizados > 0
      ? ((totalAtivos / totalSindicalizados) * 100).toFixed(2)
      : 0;

    const totalRecebido = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.valor)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.APROVADO })
      .getRawOne();

    const pagamentosMensais = await this.getPagamentosMensais(6);

    return {
      totalSindicalizados,
      totalInadimplentes,
      totalAtivos,
      pagamentosPix,
      pagamentosCartao,
      percentualAdimplencia: `${percentualAdimplencia}%`,
      totalRecebido: parseFloat(totalRecebido?.total || 0),
      pagamentosMensais,
    };
  }

  async getPreview(tipo: string): Promise<any> {
    const normalized = (tipo || '').trim().toLowerCase();

    switch (normalized) {
      case 'usuarios': {
        const total = await this.userRepository.count();
        const ativos = await this.userRepository.count({ where: { status: UserStatus.ATIVO } });
        const inadimplentes = await this.userRepository.count({ where: { status: UserStatus.INADIMPLENTE } });
        const inativos = await this.userRepository.count({ where: { status: UserStatus.INATIVO } });

        return { total, ativos, inadimplentes, inativos };
      }

      case 'pagamentos': {
        const total = await this.paymentRepository.count();
        const aprovados = await this.paymentRepository.count({ where: { status: PaymentStatus.APROVADO } });
        const pendentes = await this.paymentRepository.count({ where: { status: PaymentStatus.PENDENTE } });
        const cancelados = await this.paymentRepository.count({ where: { status: PaymentStatus.CANCELADO } });

        return { total, aprovados, pendentes, cancelados };
      }

      case 'convenios': {
        const total = await this.agreementRepository.count();
        const ativos = await this.agreementRepository.count({ where: { ativo: true } });
        const inativos = await this.agreementRepository.count({ where: { ativo: false } });

        return { total, ativos, inativos };
      }

      case 'notificacoes': {
        const total = await this.notificationRepository.count();
        const enviadas = await this.notificationRepository.count({
          where: [{ emailSent: true }, { whatsappSent: true }],
        });
        const lidas = await this.userNotificationRepository.count({ where: { lida: true } });
        const pendentes = await this.userNotificationRepository.count({ where: { lida: false } });

        return { total, enviadas, lidas, pendentes };
      }

      case 'financeiro': {
        const totalRaw = await this.paymentRepository
          .createQueryBuilder('payment')
          .select('SUM(payment.valor)', 'total')
          .getRawOne<{ total: string }>();
        const recebidoRaw = await this.paymentRepository
          .createQueryBuilder('payment')
          .select('SUM(payment.valor)', 'total')
          .where('payment.status = :status', { status: PaymentStatus.APROVADO })
          .getRawOne<{ total: string }>();
        const pendenteRaw = await this.paymentRepository
          .createQueryBuilder('payment')
          .select('SUM(payment.valor)', 'total')
          .where('payment.status = :status', { status: PaymentStatus.PENDENTE })
          .getRawOne<{ total: string }>();
        const canceladoRaw = await this.paymentRepository
          .createQueryBuilder('payment')
          .select('SUM(payment.valor)', 'total')
          .where('payment.status = :status', { status: PaymentStatus.CANCELADO })
          .getRawOne<{ total: string }>();

        return {
          total: parseFloat(totalRaw?.total || '0'),
          recebido: parseFloat(recebidoRaw?.total || '0'),
          pendente: parseFloat(pendenteRaw?.total || '0'),
          cancelado: parseFloat(canceladoRaw?.total || '0'),
        };
      }

      default:
        throw new BadRequestException(
          'Tipo inválido. Use: usuarios, pagamentos, convenios, notificacoes, financeiro',
        );
    }
  }

  async exportCsv(): Promise<string> {
    const users = await this.userRepository.find({
      select: ['nomeCompleto', 'email', 'telefone', 'status', 'numeroOAB'],
    });

    let csv = 'Nome,Email,Telefone,Status,Numero OAB\n';
    users.forEach(user => {
      csv += `${user.nomeCompleto},${user.email},${user.telefone || ''},${user.status},${user.numeroOAB}\n`;
    });

    return csv;
  }

  private normalizeTipo(tipo: string): 'usuarios' | 'pagamentos' | 'convenios' | 'notificacoes' | 'financeiro' {
    const normalized = (tipo || '').trim().toLowerCase();
    if (
      normalized === 'usuarios' ||
      normalized === 'pagamentos' ||
      normalized === 'convenios' ||
      normalized === 'notificacoes' ||
      normalized === 'financeiro'
    ) {
      return normalized;
    }

    throw new BadRequestException('Tipo inválido. Use: usuarios, pagamentos, convenios, notificacoes, financeiro');
  }

  private normalizeFormato(formato?: string): 'csv' | 'xlsx' | 'pdf' {
    const normalized = (formato || '').trim().toLowerCase();
    if (!normalized) {
      return 'xlsx';
    }
    if (normalized === 'csv' || normalized === 'xlsx' || normalized === 'pdf') {
      return normalized;
    }
    throw new BadRequestException('Formato inválido. Use: csv, xlsx, pdf');
  }

  private escapeCsv(value: any): string {
    const str = value === null || value === undefined ? '' : String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private async getDetalhadoRows(tipo: ReturnType<ReportsService['normalizeTipo']>): Promise<{ filenameBase: string; headers: string[]; rows: any[][] }> {
    switch (tipo) {
      case 'usuarios': {
        const users = await this.userRepository.find();
        const headers = [
          'id',
          'nomeCompleto',
          'email',
          'cpf',
          'numeroOAB',
          'telefone',
          'instagram',
          'enderecoResidencial',
          'enderecoProfissional',
          'status',
          'role',
          'createdAt',
        ];
        const rows = users.map((u) => [
          u.id,
          u.nomeCompleto,
          u.email,
          u.cpf,
          u.numeroOAB,
          u.telefone,
          u.instagram,
          u.enderecoResidencial,
          u.enderecoProfissional,
          u.status,
          u.role,
          u.createdAt?.toISOString?.() ?? u.createdAt,
        ]);
        return { filenameBase: 'usuarios', headers, rows };
      }

      case 'pagamentos': {
        const payments = await this.paymentRepository.find();
        const headers = ['id', 'userId', 'valor', 'metodo', 'status', 'descricao', 'createdAt', 'dataPagamento'];
        const rows = payments.map((p) => [
          p.id,
          p.userId,
          p.valor,
          p.metodo,
          p.status,
          p.descricao,
          p.createdAt?.toISOString?.() ?? p.createdAt,
          p.dataPagamento?.toISOString?.() ?? p.dataPagamento,
        ]);
        return { filenameBase: 'pagamentos', headers, rows };
      }

      case 'convenios': {
        const agreements = await this.agreementRepository.find();
        const headers = ['id', 'titulo', 'categoria', 'desconto', 'ativo', 'createdAt'];
        const rows = agreements.map((a: any) => [
          a.id,
          a.titulo,
          a.categoria,
          a.desconto,
          a.ativo,
          a.createdAt?.toISOString?.() ?? a.createdAt,
        ]);
        return { filenameBase: 'convenios', headers, rows };
      }

      case 'notificacoes': {
        const notifications = await this.notificationRepository.find();
        const headers = ['id', 'titulo', 'mensagem', 'tipo', 'emailSent', 'whatsappSent', 'createdAt'];
        const rows = notifications.map((n: any) => [
          n.id,
          n.titulo,
          n.mensagem,
          n.tipo,
          n.emailSent,
          n.whatsappSent,
          n.createdAt?.toISOString?.() ?? n.createdAt,
        ]);
        return { filenameBase: 'notificacoes', headers, rows };
      }

      case 'financeiro': {
        const payments = await this.paymentRepository.find();
        const headers = ['id', 'userId', 'valor', 'metodo', 'status', 'createdAt', 'dataPagamento'];
        const rows = payments.map((p) => [
          p.id,
          p.userId,
          p.valor,
          p.metodo,
          p.status,
          p.createdAt?.toISOString?.() ?? p.createdAt,
          p.dataPagamento?.toISOString?.() ?? p.dataPagamento,
        ]);
        return { filenameBase: 'financeiro', headers, rows };
      }
    }
  }

  private async buildCsvBuffer(tipo: ReturnType<ReportsService['normalizeTipo']>): Promise<{ filename: string; contentType: string; data: Buffer }> {
    const { filenameBase, headers, rows } = await this.getDetalhadoRows(tipo);
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(row.map((v) => this.escapeCsv(v)).join(','));
    }
    const csv = `${lines.join('\n')}\n`;
    return {
      filename: `${filenameBase}.csv`,
      contentType: 'text/csv',
      data: Buffer.from(csv, 'utf8'),
    };
  }

  private async buildXlsxBuffer(tipo: ReturnType<ReportsService['normalizeTipo']>): Promise<{ filename: string; contentType: string; data: Buffer }> {
    const { filenameBase, headers, rows } = await this.getDetalhadoRows(tipo);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatorio');

    const lastColumnIndex = headers.length;

    const titleText = `Relatório - ${filenameBase.toUpperCase()}`;
    worksheet.addRow([titleText]);
    worksheet.mergeCells(1, 1, 1, lastColumnIndex);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
    worksheet.getRow(1).height = 28;

    worksheet.addRow([]);

    const headerRowNumber = 3;
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = headers as any;
    headerRow.height = 20;

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } } as const;
    for (let col = 1; col <= lastColumnIndex; col++) {
      const cell = headerRow.getCell(col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = headerFill;
    }

    const dataStartRow = headerRowNumber + 1;
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = dataStartRow + i;
      const excelRow = worksheet.getRow(rowNumber);
      excelRow.values = rows[i] as any;
      excelRow.height = 18;

      const isEven = i % 2 === 1;
      const zebraFill = isEven
        ? ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } } as const)
        : undefined;

      for (let col = 1; col <= lastColumnIndex; col++) {
        const cell = excelRow.getCell(col);
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        if (zebraFill) {
          cell.fill = zebraFill;
        }
      }
    }

    const thinBorder = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    } as const;

    const lastDataRowNumber = dataStartRow + rows.length - 1;
    for (let r = headerRowNumber; r <= lastDataRowNumber; r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= lastColumnIndex; c++) {
        row.getCell(c).border = thinBorder;
      }
    }

    const headerToColIndex = new Map<string, number>();
    headers.forEach((h, idx) => headerToColIndex.set(h, idx + 1));

    const moneyHeaders = new Set(['valor', 'total', 'recebido', 'pendente', 'cancelado']);
    const dateHeaders = new Set(['createdAt', 'updatedAt', 'dataPagamento']);

    for (const [header, colIndex] of headerToColIndex.entries()) {
      if (moneyHeaders.has(header)) {
        for (let r = dataStartRow; r <= lastDataRowNumber; r++) {
          const cell = worksheet.getRow(r).getCell(colIndex);
          cell.numFmt = '"R$" #,##0.00';
          if (typeof cell.value === 'string' && cell.value !== '') {
            const asNumber = Number(cell.value);
            if (!Number.isNaN(asNumber)) {
              cell.value = asNumber;
            }
          }
        }
      }

      if (dateHeaders.has(header)) {
        for (let r = dataStartRow; r <= lastDataRowNumber; r++) {
          const cell = worksheet.getRow(r).getCell(colIndex);
          if (typeof cell.value === 'string' && cell.value) {
            const d = new Date(cell.value);
            if (!Number.isNaN(d.getTime())) {
              cell.value = d;
              cell.numFmt = 'dd/mm/yyyy hh:mm';
            }
          }
        }
      }
    }

    if (tipo === 'pagamentos' || tipo === 'financeiro') {
      const valorCol = headerToColIndex.get('valor');
      if (valorCol) {
        const summaryRowNumber = lastDataRowNumber + 2;
        const labelCell = worksheet.getCell(summaryRowNumber, 1);
        labelCell.value = 'Total';
        labelCell.font = { bold: true };

        const totalCell = worksheet.getCell(summaryRowNumber, valorCol);
        totalCell.value = { formula: `SUM(${worksheet.getColumn(valorCol).letter}${dataStartRow}:${worksheet.getColumn(valorCol).letter}${lastDataRowNumber})` };
        totalCell.numFmt = '"R$" #,##0.00';
        totalCell.font = { bold: true };

        for (let c = 1; c <= lastColumnIndex; c++) {
          worksheet.getRow(summaryRowNumber).getCell(c).border = thinBorder;
        }
      }
    }

    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value as any;
        const text =
          v === null || v === undefined
            ? ''
            : typeof v === 'object' && v.formula
              ? String(v.formula)
              : v instanceof Date
                ? v.toISOString()
                : String(v);

        maxLength = Math.max(maxLength, Math.min(60, text.length + 2));
      });
      col.width = maxLength;
    });

    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRowNumber }];

    const arrayBuffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
    return {
      filename: `${filenameBase}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      data: Buffer.from(arrayBuffer),
    };
  }

  private async buildPdfBuffer(tipo: ReturnType<ReportsService['normalizeTipo']>): Promise<{ filename: string; contentType: string; data: Buffer }> {
    const summary = await this.getPreview(tipo);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

    const title = `Relatório - ${tipo}`;
    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).text(`Gerado em: ${new Date().toISOString()}`);
    doc.moveDown(1);

    doc.fontSize(12);
    for (const [key, value] of Object.entries(summary ?? {})) {
      doc.text(`${key}: ${value}`);
    }

    doc.end();

    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    const data = Buffer.concat(chunks);
    return {
      filename: `${tipo}.pdf`,
      contentType: 'application/pdf',
      data,
    };
  }

  async exportReport(tipo: string, formato?: string): Promise<{ filename: string; contentType: string; data: Buffer }> {
    const t = this.normalizeTipo(tipo);
    const f = this.normalizeFormato(formato);

    if (f === 'csv') {
      return this.buildCsvBuffer(t);
    }
    if (f === 'xlsx') {
      return this.buildXlsxBuffer(t);
    }
    return this.buildPdfBuffer(t);
  }
}
