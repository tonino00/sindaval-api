import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/audit-logs/entities/audit-log.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const ip = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async () => {
        if (user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          try {
            await this.auditLogRepository.save({
              userId: user.id,
              acao: `${method} ${url}`,
              ip,
              userAgent,
              metadata: {
                body: request.body,
                params: request.params,
                query: request.query,
              },
            });
          } catch (error) {
            console.error('Erro ao salvar log de auditoria:', error);
          }
        }
      }),
    );
  }
}
