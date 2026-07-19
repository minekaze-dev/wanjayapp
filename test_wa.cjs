const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'test' }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED');
    process.exit(0);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

console.log('Initializing client...');
client.initialize().catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
});
