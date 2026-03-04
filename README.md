# Sindaval API - Sistema SaaS para Sindicato de Advogados

Backend completo desenvolvido com NestJS para gestão de sindicato de advogados.

## 🚀 Tecnologias

- **Node.js** + **NestJS**
- **PostgreSQL** com **TypeORM**
- **JWT** com HttpOnly Cookies
- **bcrypt** para hash de senhas
- **Helmet** para segurança
- **Rate Limiting** (Throttler)
- **Class-validator** para validação
- **Winston** para logs estruturados
- **Swagger** para documentação
- **Docker** e **Docker Compose**

## 📋 Funcionalidades

### Módulos Principais
- ✅ **Auth** - Autenticação com JWT e cookies seguros
- ✅ **Users** - Gestão de usuários sindicalizados
- ✅ **Admin** - Painel administrativo
- ✅ **Payments** - Integração com gateway de pagamento
- ✅ **Benefits** - Gestão de benefícios
- ✅ **Notifications** - Sistema completo de notificações
- ✅ **Reports** - Relatórios e dashboards
- ✅ **Digital Card** - Carteira digital com QR Code
- ✅ **Public Validation** - Validação pública de carteiras
- ✅ **Audit Logs** - Logs de auditoria

### Segurança
- 🔒 RBAC (Role-Based Access Control)
- 🔒 Criptografia de dados sensíveis (CPF)
- 🔒 Rate limiting
- 🔒 Helmet para headers de segurança
- 🔒 CORS configurado
- 🔒 Sanitização de inputs
- 🔒 Compliance LGPD

## 🛠️ Instalação

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16+
- Docker (opcional)

### Instalação Local

```bash
# Clonar repositório
git clone <repository-url>
cd sindaval-api

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar migrations
npm run migration:run

# Iniciar em modo desenvolvimento
npm run start:dev
```

### Instalação com Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Parar serviços
docker-compose down
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

## 🔑 Roles e Permissões

### ADMIN
- Acesso total ao sistema
- Gestão de usuários
- Criação de notificações
- Visualização de relatórios
- Exportação de dados

### FINANCEIRO
- Gestão de pagamentos
- Relatórios financeiros
- Atualização de status de pagamento

### SINDICALIZADO
- Visualização de perfil
- Acesso à carteira digital
- Visualização de benefícios
- Recebimento de notificações

## 🔐 Autenticação

A API utiliza JWT com HttpOnly Cookies para máxima segurança:

```bash
# Login
POST /api/v1/auth/login
{
  "email": "usuario@example.com",
  "password": "senha123"
}

# O token JWT é retornado em um cookie HttpOnly
# Não é necessário enviar manualmente em requisições subsequentes
```

## 📊 Endpoints Principais

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Perfil do usuário autenticado
- `POST /auth/refresh` - Renovar token

### Usuários
- `GET /users` - Listar usuários (Admin)
- `GET /users/:id` - Buscar usuário
- `POST /users` - Criar usuário (Admin)
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Remover usuário (Admin)

### Pagamentos
- `POST /payments/checkout` - Criar checkout
- `POST /payments/webhook` - Webhook do gateway
- `GET /payments` - Listar pagamentos
- `GET /payments/:id` - Buscar pagamento

### Notificações
- `POST /notifications` - Criar notificação (Admin)
- `GET /notifications` - Listar todas (Admin)
- `GET /me/notifications` - Minhas notificações
- `PATCH /me/notifications/:id/read` - Marcar como lida
- `PATCH /me/notifications/read-all` - Marcar todas como lidas
- `GET /me/notifications/unread-count` - Contador de não lidas

### Benefícios
- `GET /benefits` - Listar benefícios
- `POST /benefits` - Criar benefício (Admin)
- `PATCH /benefits/:id` - Atualizar benefício (Admin)
- `DELETE /benefits/:id` - Remover benefício (Admin)

### Carteira Digital
- `GET /digital-card/qrcode` - Gerar QR Code
- `GET /public/validar/:token` - Validar carteira (público)

### Relatórios
- `GET /reports/dashboard` - Dashboard geral
- `GET /reports/export-csv` - Exportar CSV

## 🗄️ Estrutura do Banco de Dados

### Entidades Principais
- **User** - Usuários do sistema
- **Payment** - Pagamentos
- **Benefit** - Benefícios
- **Notification** - Notificações
- **UserNotification** - Relação usuário-notificação
- **AuditLog** - Logs de auditoria

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📝 Scripts Disponíveis

```bash
npm run start          # Iniciar em produção
npm run start:dev      # Iniciar em desenvolvimento
npm run start:debug    # Iniciar em modo debug
npm run build          # Build para produção
npm run migration:generate # Gerar migration
npm run migration:run  # Executar migrations
npm run migration:revert # Reverter última migration
```

## 🔧 Configuração de Pagamentos

### Stripe
1. Criar conta em https://stripe.com
2. Obter chaves da API
3. Configurar webhook endpoint
4. Adicionar chaves no `.env`

### Mercado Pago (Alternativa)
1. Criar conta em https://mercadopago.com.br
2. Obter access token
3. Configurar webhook
4. Adicionar token no `.env`

## 📧 Configuração de Email

Configure SMTP no `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
```

## 📱 Integração WhatsApp

Utilize uma API de WhatsApp Business (ex: Twilio, WhatsApp Business API):
```env
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=seu-token
```

## 🔒 Segurança e LGPD

- CPF criptografado no banco de dados
- Logs de auditoria para todas as ações sensíveis
- Rate limiting para prevenir abuso
- Validação rigorosa de inputs
- Sanitização de dados
- Headers de segurança com Helmet

## 📈 Monitoramento

Logs estruturados com Winston:
- Logs de aplicação
- Logs de auditoria
- Logs de erro
- Logs de acesso

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário e confidencial.

## 👥 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.
