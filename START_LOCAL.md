# 🚀 Iniciar com PostgreSQL Local

Use este guia para rodar o projeto localmente enquanto resolve o problema do Aiven.

## 1️⃣ Iniciar PostgreSQL com Docker

```bash
# Inicie o PostgreSQL
docker run -d \
  --name sindaval-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sindaval_db \
  postgres:15

# Verifique se está rodando
docker ps
```

## 2️⃣ Configurar o .env

**Copie o arquivo de exemplo:**
```bash
cp .env.local.example .env
```

**Ou edite manualmente o `.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=sindaval_db
DB_SSL=false
```

## 3️⃣ Instalar dependências (se ainda não fez)

```bash
npm install
```

## 4️⃣ Iniciar a aplicação

```bash
npm run start:dev
```

## ✅ Verificar

Se tudo estiver correto, você verá:

```
[Nest] INFO [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO Application is running on: http://localhost:3000
```

Acesse:
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs

## 🔄 Voltar para o Aiven depois

Quando resolver o problema do firewall no Aiven:

1. Pare a aplicação (Ctrl+C)
2. Edite o `.env` com as credenciais do Aiven
3. Reinicie: `npm run start:dev`

## 🛑 Parar o PostgreSQL local

```bash
# Parar
docker stop sindaval-postgres

# Remover (apaga os dados)
docker rm sindaval-postgres

# Parar e remover
docker rm -f sindaval-postgres
```

## 🔧 Comandos úteis

```bash
# Ver logs do PostgreSQL
docker logs sindaval-postgres

# Acessar o PostgreSQL
docker exec -it sindaval-postgres psql -U postgres -d sindaval_db

# Listar tabelas
\dt

# Sair
\q
```

---

**Depois de testar localmente, volte para configurar o Aiven corretamente!**
