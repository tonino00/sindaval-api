# 🚀 Guia de Instalação - Sindaval API

## Pré-requisitos

- **Node.js** 20 ou superior
- **PostgreSQL** 16 ou superior
- **npm** ou **yarn**
- **Docker** (opcional, mas recomendado)

## 📦 Instalação Rápida

### Opção 1: Com Docker (Recomendado)

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd sindaval-api

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 3. Inicie os containers
docker-compose up -d

# 4. Verifique os logs
docker-compose logs -f api

# A API estará disponível em http://localhost:3000
```

### Opção 2: Instalação Local

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd sindaval-api

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Certifique-se de que o PostgreSQL está rodando
# Crie o banco de dados:
createdb sindaval_db

# 5. Execute as migrations
npm run migration:run

# 6. Inicie o servidor em modo desenvolvimento
npm run start:dev

# A API estará disponível em http://localhost:3000
```

## ⚙️ Configuração do .env

Edite o arquivo `.env` com suas configurações:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_aqui
DB_DATABASE=sindaval_db

# JWT
JWT_SECRET=gere-uma-chave-secreta-forte-aqui
JWT_REFRESH_SECRET=gere-outra-chave-secreta-forte-aqui

# Encryption (para CPF)
ENCRYPTION_KEY=chave-de-32-caracteres-aqui!!!

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app

# Gateway de Pagamento (Stripe)
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
```

## 🗄️ Banco de Dados

### Criar Migrations

```bash
npm run migration:generate -- src/database/migrations/NomeDaMigration
```

### Executar Migrations

```bash
npm run migration:run
```

### Reverter Última Migration

```bash
npm run migration:revert
```

## 👤 Criar Primeiro Usuário Admin

Após iniciar a aplicação, você precisará criar um usuário admin manualmente no banco:

```sql
INSERT INTO users (
  id,
  nome_completo,
  email,
  numero_oab,
  cpf_encrypted,
  role,
  status,
  senha_hash,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Admin Sistema',
  'admin@sindaval.com.br',
  'OAB123456',
  'CPF_CRIPTOGRAFADO',
  'ADMIN',
  'ATIVO',
  '$2b$10$hash_da_senha_aqui',
  NOW(),
  NOW()
);
```

**Nota:** Para gerar o hash da senha, use bcrypt com 10 rounds. Você pode usar um script Node.js:

```javascript
const bcrypt = require('bcrypt');
const senha = 'SuaSenhaForte123!';
bcrypt.hash(senha, 10).then(hash => console.log(hash));
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI**: http://localhost:3000/api/docs
- **JSON da API**: http://localhost:3000/api/docs-json

## 🔐 Testando a API

### 1. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sindaval.com.br",
    "password": "SuaSenhaForte123!"
  }' \
  -c cookies.txt
```

### 2. Acessar Endpoint Protegido

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -b cookies.txt
```

## 🐳 Comandos Docker Úteis

```bash
# Ver logs da API
docker-compose logs -f api

# Ver logs do PostgreSQL
docker-compose logs -f postgres

# Parar containers
docker-compose down

# Parar e remover volumes (CUIDADO: apaga o banco)
docker-compose down -v

# Rebuild da imagem
docker-compose up -d --build

# Acessar o container da API
docker-compose exec api sh

# Acessar o PostgreSQL
docker-compose exec postgres psql -U postgres -d sindaval_db
```

## 🔧 Troubleshooting

### Erro de conexão com o banco

```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps

# Verifique os logs do PostgreSQL
docker-compose logs postgres

# Recrie o container do banco
docker-compose down
docker-compose up -d postgres
```

### Erro nas migrations

```bash
# Reverta todas as migrations
npm run migration:revert

# Execute novamente
npm run migration:run
```

### Porta 3000 já em uso

```bash
# Encontre o processo usando a porta
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Mate o processo ou mude a porta no .env
PORT=3001
```

## 📊 Estrutura do Projeto

```
sindaval-api/
├── src/
│   ├── common/              # Decorators, Guards, Enums, Utils
│   ├── config/              # Configurações (TypeORM, etc)
│   ├── modules/             # Módulos da aplicação
│   │   ├── auth/           # Autenticação
│   │   ├── users/          # Usuários
│   │   ├── admin/          # Admin
│   │   ├── payments/       # Pagamentos
│   │   ├── benefits/       # Benefícios
│   │   ├── notifications/  # Notificações
│   │   ├── reports/        # Relatórios
│   │   ├── digital-card/   # Carteira Digital
│   │   ├── public-validation/ # Validação Pública
│   │   └── audit-logs/     # Logs de Auditoria
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## 🚀 Deploy em Produção

### Variáveis de Ambiente de Produção

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://seu-dominio.com.br

# Use senhas fortes e únicas
JWT_SECRET=chave-super-secreta-producao
DB_PASSWORD=senha-forte-producao

# Configure SSL para o banco
DB_SSL=true
```

### Build para Produção

```bash
npm run build
npm run start:prod
```

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

## ✅ Checklist Pós-Instalação

- [ ] Banco de dados criado e migrations executadas
- [ ] Usuário admin criado
- [ ] Variáveis de ambiente configuradas
- [ ] API respondendo em http://localhost:3000
- [ ] Swagger acessível em http://localhost:3000/api/docs
- [ ] Login funcionando
- [ ] Endpoints protegidos requerendo autenticação
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Logs sendo gerados

---

**Desenvolvido com ❤️ para o Sindicato de Advogados**
