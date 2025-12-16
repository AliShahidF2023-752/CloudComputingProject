const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres.dlazovjoliamwnvqljbq:cloudcomputingproject@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

console.log('Testing DIRECT_URL (Port 5432)...');
client.connect()
    .then(() => {
        console.log('Connected successfully to 5432');
        client.end();
    })
    .catch(e => {
        console.error('Connection error', e.message);
        client.end();
    });
