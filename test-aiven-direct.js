// Teste direto com configurações SSL específicas para Aiven
require('dotenv').config();
const { Client } = require('pg');

const configs = [
  {
    name: 'SSL com sslmode=no-verify',
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'defaultdb',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    }
  },
  {
    name: 'SSL com require mode',
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'defaultdb',
      ssl: { rejectUnauthorized: false, checkServerIdentity: () => undefined },
      connectionTimeoutMillis: 10000,
    }
  },
  {
    name: 'SSL com todas as opções desabilitadas',
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'defaultdb',
      ssl: {
        rejectUnauthorized: false,
        requestCert: false,
        verifyServerCert: false,
      },
      connectionTimeoutMillis: 10000,
    }
  },
];

async function testConfig(name, config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testando: ${name}`);
  console.log('='.repeat(60));
  
  const client = new Client(config);
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('❌ Timeout após 10 segundos');
      client.end();
      resolve(false);
    }, 10000);

    client.connect((err) => {
      clearTimeout(timeout);
      
      if (err) {
        console.log('❌ Erro na conexão:', err.message);
        console.log('Código do erro:', err.code);
        console.log('Stack:', err.stack);
        client.end();
        resolve(false);
        return;
      }

      console.log('✅ Conectado com sucesso!');
      
      client.query('SELECT version()', (err, res) => {
        if (err) {
          console.log('❌ Erro na query:', err.message);
          client.end();
          resolve(false);
          return;
        }

        console.log('✅ PostgreSQL version:', res.rows[0].version);
        
        client.query('SELECT datname FROM pg_database WHERE datistemplate = false', (err, res) => {
          if (err) {
            console.log('❌ Erro ao listar bancos:', err.message);
          } else {
            console.log('\n📋 Bancos disponíveis:');
            res.rows.forEach(row => console.log(`  - ${row.datname}`));
          }
          
          client.end();
          resolve(true);
        });
      });
    });
  });
}

(async () => {
  console.log('\n🔍 DIAGNÓSTICO DETALHADO - AIVEN POSTGRESQL\n');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USERNAME);
  console.log('Database inicial: defaultdb');
  
  for (const { name, config } of configs) {
    const success = await testConfig(name, config);
    if (success) {
      console.log('\n\n🎉 SUCESSO! Use esta configuração no TypeORM!');
      console.log('\nNo seu .env:');
      console.log('DB_DATABASE=defaultdb');
      console.log('DB_SSL=true');
      process.exit(0);
    }
  }
  
  console.log('\n\n❌ Nenhuma configuração funcionou.');
  console.log('\n🔧 Próximos passos:');
  console.log('1. Verifique no console Aiven se o serviço está 100% ativo (verde)');
  console.log('2. Tente reiniciar o serviço no console Aiven');
  console.log('3. Verifique se há algum erro ou aviso no painel do Aiven');
  console.log('4. Considere criar um novo serviço PostgreSQL no Aiven');
  process.exit(1);
})();
