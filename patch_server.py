import re

with open('server.ts', 'r') as f:
    content = f.read()

cron_logic = """
// --- WhatsApp Cron Job ---
setInterval(async () => {
  try {
    const now = new Date();
    // format local date and time roughly
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    const { data: dueSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('status', 'Pending')
      .eq('date', dateStr);

    if (dueSchedules) {
      for (const schedule of dueSchedules) {
        if (schedule.time <= timeStr) {
          const userId = schedule.sales_id;
          const clientData = waClients.get(userId);
          
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
              
            } catch (err: any) {
              await supabase.from('schedules').update({ status: 'Failed' }).eq('id', schedule.id);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Cron error', e);
  }
}, 60000); // Check every minute
"""

content = content.replace("async function startServer() {", cron_logic + "\nasync function startServer() {")

with open('server.ts', 'w') as f:
    f.write(content)
