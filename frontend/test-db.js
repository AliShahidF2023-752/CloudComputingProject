const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres.dlazovjoliamwnvqljbq:cloudcomputingproject@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => {
        console.log('Connected successfully');
        client.end();
    })
    .catch(e => {
        console.error('Connection error', e.message);
        client.end();
    });
