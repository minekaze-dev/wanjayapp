import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import qrcode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import pkg from 'whatsapp-web.js';

const { Client, LocalAuth } = pkg;

let _filename: string;
let _dirname: string;

try {
  _filename = fileURLToPath(import.meta.url);
  _dirname = path.dirname(_filename);
} catch (e) {
  _filename = __filename;
  _dirname = __dirname;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pgdqepdyvsxeurwpjsgv.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZHFlcGR5dnN4ZXVyd3Bqc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzQwNjMsImV4cCI6MjA5OTk1MDA2M30.A3Wu3jAABolXfSzwLmA6mWewR3CzIY_nsU0YUGawluM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- WhatsApp Client Management ---
// To avoid excessive memory usage, we manage clients per user ID
interface WAClientData {
  client: any;
  status: 'disconnected' | 'qr' | 'connected' | 'reconnecting';
  qrDataUrl: string | null;
}

const waClients = new Map<string, WAClientData>();

async function getOrCreateClient(userId: string) {
  if (waClients.has(userId)) {
    return waClients.get(userId)!;
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `user-${userId}` }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
  });

  const clientData: WAClientData = {
    client,
    status: 'reconnecting',
    qrDataUrl: null,
  };
  waClients.set(userId, clientData);

  client.on('qr', async (qr) => {
    console.log(`[WA-${userId}] QR Received`);
    clientData.status = 'qr';
    clientData.qrDataUrl = await qrcode.toDataURL(qr);
  });

  client.on('ready', async () => {
    console.log(`[WA-${userId}] Client is ready!`);
    clientData.status = 'connected';
    clientData.qrDataUrl = null;
    await supabase.from('users').update({ whatsapp_status: 'connected' }).eq('id', userId);
  });

  client.on('authenticated', () => {
    console.log(`[WA-${userId}] Authenticated!`);
  });

  client.on('auth_failure', async msg => {
    console.error(`[WA-${userId}] Auth failure`, msg);
    clientData.status = 'disconnected';
    await supabase.from('users').update({ whatsapp_status: 'disconnected' }).eq('id', userId);
  });

  client.on('disconnected', async (reason) => {
    console.log(`[WA-${userId}] Disconnected`, reason);
    clientData.status = 'disconnected';
    await supabase.from('users').update({ whatsapp_status: 'disconnected' }).eq('id', userId);
    client.destroy();
    waClients.delete(userId);
  });

  client.on('message', async msg => {
    try {
      const contact = await msg.getContact();
      await supabase.from('inbox').insert({
        customer_name: contact.name || contact.pushname || msg.from.split('@')[0],
        whatsapp_number: msg.from.split('@')[0],
        last_message: msg.body,
        time_ago: 'Baru saja',
        unread: true
      });
      await supabase.from('activities').insert({
        type: 'reply',
        content: `Balasan diterima dari ${contact.name || contact.pushname || msg.from.split('@')[0]}`,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error handling incoming message', e);
    }
  });

  console.log(`[WA-${userId}] Initializing client...`);
  client.initialize().then(() => {
    console.log(`[WA-${userId}] Initialization call finished`);
  }).catch(err => {
    console.error(`[WA-${userId}] Init failed`, err);
    clientData.status = 'disconnected';
  });

  return clientData;
}


// --- API Routes ---

app.post('/api/whatsapp/start', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  
  await getOrCreateClient(userId);
  res.json({ success: true, message: 'Client initialized' });
});

app.get('/api/whatsapp/status/:userId', (req, res) => {
  const { userId } = req.params;
  const clientData = waClients.get(userId);
  if (!clientData) {
    return res.json({ status: 'disconnected', qrDataUrl: null });
  }
  res.json({ status: clientData.status, qrDataUrl: clientData.qrDataUrl });
});

app.post('/api/whatsapp/logout', async (req, res) => {
  const { userId } = req.body;
  const clientData = waClients.get(userId);
  if (clientData) {
    try {
      await clientData.client.logout();
    } catch (e) {}
    try {
      await clientData.client.destroy();
    } catch (e) {}
    waClients.delete(userId);
  }
  await supabase.from('users').update({ whatsapp_status: 'disconnected' }).eq('id', userId);
  res.json({ success: true });
});

app.post('/api/whatsapp/send', async (req, res) => {
  const { userId, to, message } = req.body;
  if (!userId || !to || !message) return res.status(400).json({ error: 'Missing parameters' });
  
  const clientData = waClients.get(userId);
  if (!clientData || clientData.status !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp not connected for this user' });
  }

  try {
    const formattedNumber = to.includes('@c.us') ? to : `${to.replace(/\D/g, '')}@c.us`;
    await clientData.client.sendMessage(formattedNumber, message);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});


// --- WhatsApp Cron Job ---
setInterval(async () => {
  try {
    const now = new Date();
    // format local date and time roughly
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    console.log("===== CRON =====");
    console.log("Date :", dateStr);
    console.log("Time :", timeStr);

    const { data: dueSchedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('status', 'Pending')
      .eq('date', dateStr);

    if (error) {
      console.log("Error fetching schedules:", error);
    }
    console.log("Found schedules:", dueSchedules?.length || 0);

    if (dueSchedules) {
      for (const schedule of dueSchedules) {
        if (schedule.time <= timeStr) {
          const userId = schedule.sales_id;
          const clientData = waClients.get(userId);
          
          console.log(`Checking schedule ${schedule.id} for user ${userId}. WA Status: ${clientData?.status}`);

          if (clientData && clientData.status === 'connected') {
            try {
              // mark sending
              await supabase.from('schedules').update({ status: 'Sending' }).eq('id', schedule.id);
              
              const to = schedule.whatsapp_number;
              const formattedNumber = to.includes('@c.us') ? to : `${to.replace(/\D/g, '')}@c.us`;
              await clientData.client.sendMessage(formattedNumber, schedule.message);
              
              // mark sent
              await supabase.from('schedules').update({ status: 'Sent' }).eq('id', schedule.id);
              
              // create activity
              await supabase.from('activities').insert({
                type: 'schedule_created', // reused as 'sent'
                content: `Pesan ke ${schedule.customer_name} berhasil dikirim.`,
                timestamp: new Date().toISOString()
              });
              console.log(`Successfully sent message for schedule ${schedule.id}`);
              
            } catch (err: any) {
              console.error(`Failed to send message for schedule ${schedule.id}:`, err);
              await supabase.from('schedules').update({ status: 'Failed' }).eq('id', schedule.id);
            }
          } else {
            console.log(`Skipping schedule ${schedule.id} because WhatsApp is not connected for user ${userId}`);
          }
        }
      }
    }
  } catch (e) {
    console.error('Cron error', e);
  }
}, 60000); // Check every minute


// Vite / Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(_dirname, '..');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
