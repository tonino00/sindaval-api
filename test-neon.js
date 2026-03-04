// Teste de conexão com Neon PostgreSQL
const { Client } = require('pg');

const config = {
  host: 'ep-orange-bird-aipx0zik-pooler.c-4.us-east-1.aws.neon.tech',
  port: 5432,
  user: 'neondb_owner',
  password: 'npg_DVqyuEYe43aC',
  database: 'neondb',
  ssl: {
    rejectUnauthorized: false,
  },
};

console.log('🔍 Testando conexão com Neon PostgreSQL\n');
console.log('Host:', config.host);
console.log('Database:', config.database);
console.log('\nConectando...\n');

const client = new Client(config);

client.connect((err) => {
  if (err) {
    console.error('❌ Erro na conexão:', err.message);
    console.error(err);
    process.exit(1);
  }

  console.log('✅ Conexão estabelecida com sucesso!\n');

  client.query('SELECT version()', (err, res) => {
    if (err) {
      console.error('❌ Erro ao consultar versão:', err.message);
      client.end();
      process.exit(1);
    }

    console.log('📊 PostgreSQL Version:');
    console.log(res.rows[0].version);
    console.log('');

    client.query('SELECT current_database(), current_user', (err, res) => {
      if (err) {
        console.error('❌ Erro:', err.message);
        client.end();
        process.exit(1);
      }

      console.log('📋 Informações da conexão:');
      console.log('Database:', res.rows[0].current_database);
      console.log('User:', res.rows[0].current_user);

      console.log('\n✅ SUCESSO! Neon está funcionando perfeitamente!');
      console.log('\n📝 Agora copie o arquivo .env.neon.example para .env');
      console.log('   cp .env.neon.example .env');
      console.log('\nDepois inicie a aplicação:');
      console.log('   npm run start:dev');

      client.end();
      process.exit(0);
    });
  });
});
