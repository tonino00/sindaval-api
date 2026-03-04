// Teste específico para PostgreSQL 17 no Aiven
require('dotenv').config();
const { Client } = require('pg');
const tls = require('tls');

// Configuração SSL específica para PostgreSQL 17
const sslConfig = {
  rejectUnauthorized: false,
  // Permite versões TLS mais antigas e novas
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  // Desabilita verificações de certificado
  checkServerIdentity: () => undefined,
};

const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: 'defaultdb',
  ssl: sslConfig,
  connectionTimeoutMillis: 15000,
  query_timeout: 10000,
};

console.log('🔍 Testando conexão com PostgreSQL 17 no Aiven\n');
console.log('Configuração:');
console.log('Host:', config.host);
console.log('Port:', config.port);
console.log('User:', config.user);
console.log('Database:', config.database);
console.log('SSL:', 'Habilitado com TLS 1.2/1.3');
console.log('\nConectando...\n');

const client = new Client(config);

client.connect((err) => {
  if (err) {
    console.error('❌ Erro na conexão:', err.message);
    console.error('\nDetalhes completos:');
    console.error(err);
    
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Aguarde alguns minutos - o serviço pode estar inicializando');
    console.log('2. Verifique se o status está verde no console Aiven');
    console.log('3. Tente reiniciar o serviço no console Aiven');
    console.log('4. Verifique se a senha está correta (sem espaços extras)');
    
    process.exit(1);
  }

  console.log('✅ Conexão estabelecida com sucesso!\n');

  // Testar versão do PostgreSQL
  client.query('SELECT version()', (err, res) => {
    if (err) {
      console.error('❌ Erro ao consultar versão:', err.message);
      client.end();
      process.exit(1);
    }

    console.log('📊 PostgreSQL Version:');
    console.log(res.rows[0].version);
    console.log('');

    // Listar bancos de dados
    client.query('SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname', (err, res) => {
      if (err) {
        console.error('❌ Erro ao listar bancos:', err.message);
        client.end();
        process.exit(1);
      }

      console.log('📋 Bancos de dados disponíveis:');
      res.rows.forEach(row => {
        console.log(`  - ${row.datname}`);
      });

      console.log('\n✅ SUCESSO! A conexão está funcionando!');
      console.log('\n📝 Configure seu .env assim:');
      console.log('DB_HOST=' + process.env.DB_HOST);
      console.log('DB_PORT=' + process.env.DB_PORT);
      console.log('DB_USERNAME=' + process.env.DB_USERNAME);
      console.log('DB_PASSWORD=' + process.env.DB_PASSWORD);
      console.log('DB_DATABASE=defaultdb');
      console.log('DB_SSL=true');

      client.end();
      process.exit(0);
    });
  });
});

// Timeout de segurança
setTimeout(() => {
  console.error('\n❌ Timeout - conexão demorou mais de 15 segundos');
  console.log('\n🔧 O serviço pode estar reiniciando ou com problemas.');
  console.log('Aguarde alguns minutos e tente novamente.');
  process.exit(1);
}, 15000);
