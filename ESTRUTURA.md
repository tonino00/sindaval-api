# 📁 Estrutura Completa do Projeto

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, com separação clara de responsabilidades:

```
sindaval-api/
│
├── src/
│   ├── common/                    # Código compartilhado
│   │   ├── decorators/           # Decorators customizados
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── enums/                # Enumerações
│   │   │   ├── notification-channel.enum.ts
│   │   │   ├── notification-segment.enum.ts
│   │   │   ├── notification-type.enum.ts
│   │   │   ├── payment-method.enum.ts
│   │   │   ├── payment-status.enum.ts
│   │   │   ├── user-role.enum.ts
│   │   │   └── user-status.enum.ts
│   │   ├── guards/               # Guards de autenticação/autorização
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/         # Interceptors
│   │   │   └── audit-log.interceptor.ts
│   │   └── utils/                # Utilitários
│   │       └── encryption.util.ts
│   │
│   ├── config/                    # Configurações
│   │   └── typeorm.config.ts
│   │
│   ├── modules/                   # Módulos da aplicação
│   │   │
│   │   ├── auth/                 # 🔐 Autenticação
│   │   │   ├── dto/
│   │   │   │   └── login.dto.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   └── auth.service.ts
│   │   │
│   │   ├── users/                # 👥 Usuários
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.module.ts
│   │   │   └── users.service.ts
│   │   │
│   │   ├── admin/                # 👨‍💼 Administração
│   │   │   ├── admin.controller.ts
│   │   │   └── admin.module.ts
│   │   │
│   │   ├── payments/             # 💰 Pagamentos
│   │   │   ├── dto/
│   │   │   │   └── create-payment.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── payment.entity.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.module.ts
│   │   │   └── payments.service.ts
│   │   │
│   │   ├── benefits/             # 🎁 Benefícios
│   │   │   ├── dto/
│   │   │   │   ├── create-benefit.dto.ts
│   │   │   │   └── update-benefit.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── benefit.entity.ts
│   │   │   ├── benefits.controller.ts
│   │   │   ├── benefits.module.ts
│   │   │   └── benefits.service.ts
│   │   │
│   │   ├── notifications/        # 🔔 Notificações
│   │   │   ├── dto/
│   │   │   │   └── create-notification.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── notification.entity.ts
│   │   │   │   └── user-notification.entity.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.module.ts
│   │   │   └── notifications.service.ts
│   │   │
│   │   ├── reports/              # 📊 Relatórios
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.module.ts
│   │   │   └── reports.service.ts
│   │   │
│   │   ├── digital-card/         # 🪪 Carteira Digital
│   │   │   ├── digital-card.controller.ts
│   │   │   ├── digital-card.module.ts
│   │   │   └── digital-card.service.ts
│   │   │
│   │   ├── public-validation/    # ✅ Validação Pública
│   │   │   ├── public-validation.controller.ts
│   │   │   ├── public-validation.module.ts
│   │   │   └── public-validation.service.ts
│   │   │
│   │   └── audit-logs/           # 📝 Logs de Auditoria
│   │       ├── entities/
│   │       │   └── audit-log.entity.ts
│   │       └── audit-logs.module.ts
│   │
│   ├── app.module.ts             # Módulo raiz
│   └── main.ts                   # Entry point
│
├── logs/                          # Logs da aplicação
├── .env.example                   # Exemplo de variáveis de ambiente
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── nest-cli.json
├── package.json
├── README.md
├── INSTALACAO.md
├── ESTRUTURA.md
└── tsconfig.json
```

## 🔑 Principais Componentes

### 1. **Autenticação (Auth Module)**
- JWT com HttpOnly Cookies
- Refresh tokens
- Estratégias Local e JWT
- Guards de autenticação

### 2. **Autorização (RBAC)**
- 3 roles: ADMIN, FINANCEIRO, SINDICALIZADO
- Guards baseados em roles
- Decorators customizados (@Roles, @CurrentUser)

### 3. **Usuários (Users Module)**
- CRUD completo
- Criptografia de CPF
- Validação de dados
- Gestão de status

### 4. **Pagamentos (Payments Module)**
- Integração com gateway (Stripe/Mercado Pago)
- Webhook para confirmação
- Histórico de transações
- Atualização automática de status

### 5. **Benefícios (Benefits Module)**
- Cadastro de benefícios
- Listagem pública
- Gestão por admins

### 6. **Notificações (Notifications Module)**
- Sistema completo de notificações
- Segmentação (ativos, inadimplentes, todos)
- Multicanal (interna, email, WhatsApp)
- Contador de não lidas
- Marcar como lida

### 7. **Relatórios (Reports Module)**
- Dashboard com estatísticas
- Exportação CSV
- Métricas de adimplência
- Totalizadores

### 8. **Carteira Digital (Digital Card Module)**
- Geração de QR Code único
- Token de validação
- Informações da carteira

### 9. **Validação Pública (Public Validation Module)**
- Endpoint público para validar QR Code
- Retorna status da carteira
- Sem necessidade de autenticação

### 10. **Auditoria (Audit Logs Module)**
- Logs automáticos de ações
- Rastreamento de IP e User-Agent
- Metadata das requisições

## 🗄️ Entidades do Banco de Dados

### User
```typescript
- id: UUID
- nomeCompleto: string
- enderecoResidencial: string
- enderecoProfissional: string
- telefone: string
- email: string (unique)
- numeroOAB: string (unique)
- cpfEncrypted: string (criptografado)
- instagram: string
- role: UserRole (ADMIN | FINANCEIRO | SINDICALIZADO)
- status: UserStatus (ATIVO | INADIMPLENTE | INATIVO)
- senhaHash: string
- qrToken: string (unique)
- createdAt: Date
- updatedAt: Date
```

### Payment
```typescript
- id: UUID
- userId: UUID (FK)
- valor: decimal
- metodo: PaymentMethod (PIX | CARTAO | BOLETO)
- status: PaymentStatus
- gatewayTransactionId: string
- dataPagamento: Date
- descricao: string
- metadata: JSON
- createdAt: Date
- updatedAt: Date
```

### Benefit
```typescript
- id: UUID
- titulo: string
- descricao: string
- regrasUso: string
- contato: string
- imagemUrl: string
- ativo: boolean
- createdAt: Date
- updatedAt: Date
```

### Notification
```typescript
- id: UUID
- titulo: string
- mensagem: string
- tipo: NotificationType (GERAL | INDIVIDUAL)
- canal: NotificationChannel
- segmento: NotificationSegment
- createdBy: UUID (FK)
- targetUserId: UUID (FK, nullable)
- emailSent: boolean
- whatsappSent: boolean
- createdAt: Date
```

### UserNotification
```typescript
- id: UUID
- userId: UUID (FK)
- notificationId: UUID (FK)
- lida: boolean
- dataLeitura: Date
- createdAt: Date
```

### AuditLog
```typescript
- id: UUID
- userId: UUID (FK, nullable)
- acao: string
- ip: string
- metadata: JSON
- userAgent: string
- dataHora: Date
```

## 🔒 Segurança Implementada

1. **Helmet** - Headers de segurança HTTP
2. **Rate Limiting** - Proteção contra abuso
3. **CORS** - Configurado para origem específica
4. **JWT HttpOnly Cookies** - Tokens seguros
5. **Bcrypt** - Hash de senhas (10 rounds)
6. **Criptografia AES-256-GCM** - Para dados sensíveis (CPF)
7. **Class-validator** - Validação de inputs
8. **Sanitização** - Prevenção de XSS e SQL Injection
9. **Audit Logs** - Rastreamento de ações

## 📡 Endpoints Principais

### Públicos
- `POST /auth/login` - Login
- `POST /auth/refresh` - Renovar token
- `GET /public/validar/:token` - Validar carteira
- `GET /benefits` - Listar benefícios

### Autenticados
- `GET /auth/me` - Perfil do usuário
- `POST /auth/logout` - Logout
- `GET /me/notifications` - Minhas notificações
- `GET /digital-card/qrcode` - Gerar QR Code
- `POST /payments/checkout` - Criar pagamento

### Admin
- `POST /users` - Criar usuário
- `POST /notifications` - Criar notificação
- `GET /reports/dashboard` - Dashboard
- `GET /reports/export-csv` - Exportar CSV
- `POST /benefits` - Criar benefício

### Financeiro
- `GET /payments` - Listar pagamentos
- `GET /reports/dashboard` - Dashboard

## 🎯 Próximos Passos

1. Executar `npm install` para instalar dependências
2. Configurar `.env` com suas credenciais
3. Executar migrations do banco de dados
4. Criar usuário admin inicial
5. Testar endpoints via Swagger
6. Configurar gateway de pagamento
7. Configurar SMTP para emails
8. Configurar API do WhatsApp

---

**Sistema desenvolvido seguindo as melhores práticas de segurança e arquitetura**
