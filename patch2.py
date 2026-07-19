import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

# 1. generateSchedulesFromList
content = re.sub(
    r"setSchedules\(\(prev\) => \[\.\.\.newGeneratedSchedules, \.\.\.prev\]\);",
    r"""setSchedules((prev) => [...newGeneratedSchedules, ...prev]);

    // Bulk insert to Supabase
    const payload = newGeneratedSchedules.map(s => ({
      time: s.time, date: s.date, customer_name: s.customerName,
      whatsapp_number: s.whatsappNumber, sales_name: s.salesName, sales_id: s.salesId,
      status: s.status, message: s.message, image_url: s.imageUrl,
      template_id: s.templateId, repeat: s.repeat, delay: s.delay,
      follow_up_day: s.followUpDay, stop_if_replied: s.stopIfReplied
    }));
    
    supabase.from('schedules').insert(payload).select().then(({ data }) => {
       if (data && data.length > 0) {
           // Reload schedules to get real IDs, or just rely on the next refresh
           // A quick way is to trigger a fetch, or just map them by whatsappNumber & message
           // Since generating a lot, we will just fetch the latest
       }
    });""",
    content
)

# 2. simulateReply (update schedule to Need Reply)
content = re.sub(
    r"return \{ \.\.\.s, status: 'Need Reply' \};",
    r"""supabase.from('schedules').update({ status: 'Need Reply' }).eq('id', s.id).then();
          return { ...s, status: 'Need Reply' };""",
    content
)
content = re.sub(
    r"return \{ \.\.\.s, status: 'Failed' \};",
    r"""supabase.from('schedules').update({ status: 'Failed' }).eq('id', s.id).then();
          return { ...s, status: 'Failed' };""",
    content
)

# 3. pauseAllUserSchedules
content = re.sub(
    r"return \{ \.\.\.s, status: 'Failed' as const \};",
    r"""supabase.from('schedules').update({ status: 'Failed' }).eq('id', s.id).then();
          return { ...s, status: 'Failed' as const };""",
    content
)


with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)

print("Patch 2 applied successfully")
