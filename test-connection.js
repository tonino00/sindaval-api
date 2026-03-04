// Script de teste de conexão com Aiven
require('dotenv').config();
const { Client } = require('pg');

// Teste 1: SSL com rejectUnauthorized false
const config1 = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
};

// Teste 2: SSL true (modo require)
const config2 = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: true,
};

// Teste 3: connectionString
const config3 = {
  connectionString: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}?sslmode=require`,
};

// Teste 4: Sem especificar database (conecta no defaultdb)
const config4 = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: 'defaultdb', // Banco padrão do Aiven
  ssl: {
    rejectUnauthorized: false,
  },
};

// Teste 5: Tentar postgres como database
const config5 = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false,
  },
};

// Teste 6: Conectar sem database e listar bancos disponíveis
const config6 = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
};

async function testConnection(config, name) {
  console.log(`\n🔍 Testando ${name}...`);
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log(`✅ ${name} - Conexão bem-sucedida!`);
    const res = await client.query('SELECT version()');
    console.log('PostgreSQL version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ ${name} - Falhou:`, err.message);
    return false;
  }
}

async function listDatabases(config, name) {
  console.log(`\n🔍 ${name}...`);
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log(`✅ Conectado!`);
    const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('\n📋 Bancos de dados disponíveis:');
    res.rows.forEach(row => console.log(`  - ${row.datname}`));
    await client.end();
    return res.rows.map(r => r.datname);
  } catch (err) {
    console.log(`❌ Falhou:`, err.message);
    return null;
  }
}

const client = new Client(config1);

console.log('='.repeat(60));
console.log('Testando conexão com Aiven PostgreSQL');
console.log('='.repeat(60));
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('Database:', process.env.DB_DATABASE);
console.log('User:', process.env.DB_USERNAME);
console.log('='.repeat(60));

(async () => {
  const success1 = await testConnection(config1, 'Config 1: SSL rejectUnauthorized=false');
  if (success1) {
    console.log('\n✅ Use esta configuração no TypeORM!');
    process.exit(0);
  }
  
  const success2 = await testConnection(config2, 'Config 2: SSL=true');
  if (success2) {
    console.log('\n✅ Use esta configuração no TypeORM!');
    process.exit(0);
  }
  
  const success3 = await testConnection(config3, 'Config 3: Connection String');
  if (success3) {
    console.log('\n✅ Use connection string no TypeORM!');
    process.exit(0);
  }
  
  const success4 = await testConnection(config4, 'Config 4: Database=defaultdb');
  if (success4) {
    console.log('\n✅ O banco correto é "defaultdb", não "sindaval-db"!');
    console.log('Atualize o .env: DB_DATABASE=defaultdb');
    process.exit(0);
  }
  
  const success5 = await testConnection(config5, 'Config 5: Database=postgres');
  if (success5) {
    console.log('\n✅ O banco correto é "postgres"!');
    console.log('Atualize o .env: DB_DATABASE=postgres');
    process.exit(0);
  }
  
  // Tentar listar bancos disponíveis
  const databases = await listDatabases(config6, 'Config 6: Listar bancos disponíveis');
  if (databases && databases.length > 0) {
    console.log(`\n✅ Conexão funcionou! Use um destes bancos no .env:`);
    databases.forEach(db => console.log(`   DB_DATABASE=${db}`));
    process.exit(0);
  }
  
  console.log('\n❌ Nenhuma configuração funcionou!');
  console.log('\n🔧 Possíveis soluções:');
  console.log('1. Verifique se o serviço Aiven está ativo (verde)');
  console.log('2. Verifique o firewall no console Aiven');
  console.log('3. Verifique se as credenciais estão corretas');
  console.log('4. Tente criar um novo serviço no Aiven');
  process.exit(1);
})();
