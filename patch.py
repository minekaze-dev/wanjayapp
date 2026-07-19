import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

# 1. addSchedule
content = re.sub(
    r"const addSchedule = \(scheduleData: Omit<Schedule, 'id'>\) => \{[\s\S]*?setSchedules\(\(prev\) => \[newSchedule, \.\.\.prev\]\);",
    r"""const addSchedule = (scheduleData: Omit<Schedule, 'id'>) => {
    const tempId = 's_' + Math.random().toString(36).substring(2, 9);
    const newSchedule: Schedule = { ...scheduleData, id: tempId };
    setSchedules((prev) => [newSchedule, ...prev]);

    supabase.from('schedules').insert({
      time: scheduleData.time, date: scheduleData.date, customer_name: scheduleData.customerName,
      whatsapp_number: scheduleData.whatsappNumber, sales_name: scheduleData.salesName, sales_id: scheduleData.salesId,
      status: scheduleData.status, message: scheduleData.message, image_url: scheduleData.imageUrl,
      template_id: scheduleData.templateId, repeat: scheduleData.repeat, delay: scheduleData.delay,
      follow_up_day: scheduleData.followUpDay, stop_if_replied: scheduleData.stopIfReplied
    }).select().single().then(({ data }) => {
      if (data) setSchedules(prev => prev.map(s => s.id === tempId ? { ...s, id: data.id } : s));
    });""",
    content
)

# 2. updateSchedule
content = re.sub(
    r"const updateSchedule = \(updated: Schedule\) => \{[\s\S]*?setSchedules\(\(prev\) => prev\.map\(\(s\) => \(s\.id === updated\.id \? updated : s\)\)\);",
    r"""const updateSchedule = (updated: Schedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    supabase.from('schedules').update({
      time: updated.time, date: updated.date, customer_name: updated.customerName,
      whatsapp_number: updated.whatsappNumber, sales_name: updated.salesName, sales_id: updated.salesId,
      status: updated.status, message: updated.message, image_url: updated.imageUrl,
      template_id: updated.templateId, repeat: updated.repeat, delay: updated.delay,
      follow_up_day: updated.followUpDay, stop_if_replied: updated.stopIfReplied
    }).eq('id', updated.id).then();""",
    content
)

# 3. pauseSchedule
content = re.sub(
    r"const pauseSchedule = \(id: string\) => \{[\s\S]*?setSchedules\(\(prev\) =>[\s\S]*?if \(s\.id === id\) \{[\s\S]*?const newStatus: ScheduleStatusType = s\.status === 'Pending' \? 'Failed' : 'Pending';[\s\S]*?showToast\(`Schedule \$\{s\.customerName\} di-\$\{newStatus === 'Failed' \? 'Pause \(Failed\)' : 'Resume'\}\`, 'info'\);[\s\S]*?return \{ \.\.\.s, status: newStatus \};[\s\S]*?\}[\s\S]*?return s;[\s\S]*?\}\)[\s\S]*?\);",
    r"""const pauseSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newStatus: ScheduleStatusType = s.status === 'Pending' ? 'Failed' : 'Pending';
          showToast(`Schedule ${s.customerName} di-${newStatus === 'Failed' ? 'Pause (Failed)' : 'Resume'}`, 'info');
          supabase.from('schedules').update({ status: newStatus }).eq('id', id).then();
          return { ...s, status: newStatus };
        }
        return s;
      })
    );""",
    content
)

# 4. deleteSchedule
content = re.sub(
    r"const deleteSchedule = \(id: string\) => \{[\s\S]*?setSchedules\(\(prev\) => prev\.filter\(\(s\) => s\.id !== id\)\);",
    r"""const deleteSchedule = (id: string) => {
    const target = schedules.find((s) => s.id === id);
    if (!target) return;

    setSchedules((prev) => prev.filter((s) => s.id !== id));
    supabase.from('schedules').delete().eq('id', id).then();""",
    content
)

# 5. addTemplate
content = re.sub(
    r"const addTemplate = \(tData: Omit<Template, 'id'>\) => \{[\s\S]*?setTemplates\(\(prev\) => \[\.\.\.prev, newTemplate\]\);",
    r"""const addTemplate = (tData: Omit<Template, 'id'>) => {
    const tempId = 't_' + Math.random().toString(36).substring(2, 9);
    const newTemplate: Template = { ...tData, id: tempId };
    setTemplates((prev) => [...prev, newTemplate]);
    
    supabase.from('templates').insert({ name: tData.name, content: tData.content }).select().single().then(({ data }) => {
      if (data) setTemplates(prev => prev.map(t => t.id === tempId ? { ...t, id: data.id } : t));
    });""",
    content
)

# 6. updateTemplate
content = re.sub(
    r"const updateTemplate = \(updated: Template\) => \{[\s\S]*?setTemplates\(\(prev\) => prev\.map\(\(t\) => \(t\.id === updated\.id \? updated : t\)\)\);",
    r"""const updateTemplate = (updated: Template) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    supabase.from('templates').update({ name: updated.name, content: updated.content }).eq('id', updated.id).then();""",
    content
)

# 7. deleteTemplate
content = re.sub(
    r"const deleteTemplate = \(id: string\) => \{[\s\S]*?setTemplates\(\(prev\) => prev\.filter\(\(t\) => t\.id !== id\)\);",
    r"""const deleteTemplate = (id: string) => {
    const target = templates.find((t) => t.id === id);
    if (!target) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    supabase.from('templates').delete().eq('id', id).then();""",
    content
)

# 8. addUser
content = re.sub(
    r"const addUser = \(userData: Omit<User, 'id'>\) => \{[\s\S]*?setUsers\(\(prev\) => \[\.\.\.prev, newUser\]\);",
    r"""const addUser = (userData: Omit<User, 'id'>) => {
    const tempId = 'u_' + Math.random().toString(36).substring(2, 9);
    const newUser: User = { ...userData, id: tempId };
    setUsers((prev) => [...prev, newUser]);

    supabase.from('users').insert({
      name: userData.name, email: userData.email, role: userData.role, access_code: userData.accessCode,
      whatsapp_status: userData.whatsappStatus, last_active: userData.lastActive, disabled: userData.disabled
    }).select().single().then(({ data }) => {
      if (data) setUsers(prev => prev.map(u => u.id === tempId ? { ...u, id: data.id } : u));
    });""",
    content
)

# 9. updateUser
content = re.sub(
    r"const updateUser = \(updated: User\) => \{[\s\S]*?setUsers\(\(prev\) => prev\.map\(\(u\) => \(u\.id === updated\.id \? updated : u\)\)\);",
    r"""const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    supabase.from('users').update({
      name: updated.name, email: updated.email, role: updated.role, access_code: updated.accessCode,
      whatsapp_status: updated.whatsappStatus, last_active: updated.lastActive, disabled: updated.disabled
    }).eq('id', updated.id).then();""",
    content
)

# 10. toggleUserStatus
content = re.sub(
    r"const toggleUserStatus = \(id: string\) => \{[\s\S]*?setUsers\(\(prev\) =>[\s\S]*?if \(u\.id === id\) \{[\s\S]*?const disabled = !u\.disabled;[\s\S]*?showToast\(`User \$\{u\.name\} di-\$\{disabled \? 'nonaktifkan' : 'aktifkan'\}\`, 'info'\);[\s\S]*?return \{ \.\.\.u, disabled \};[\s\S]*?\}[\s\S]*?return u;[\s\S]*?\}\)[\s\S]*?\);",
    r"""const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const disabled = !u.disabled;
          showToast(`User ${u.name} di-${disabled ? 'nonaktifkan' : 'aktifkan'}`, 'info');
          supabase.from('users').update({ disabled }).eq('id', id).then();
          return { ...u, disabled };
        }
        return u;
      })
    );""",
    content
)

# 11. deleteUser
content = re.sub(
    r"const deleteUser = \(id: string\) => \{[\s\S]*?setUsers\(\(prev\) => prev\.filter\(\(u\) => u\.id !== id\)\);",
    r"""const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (currentUser?.id === id) {
      showToast('Anda tidak bisa menghapus diri sendiri!', 'warning');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    supabase.from('users').delete().eq('id', id).then();""",
    content
)

# 12. markInboxItemAsRead
content = re.sub(
    r"const markInboxItemAsRead = \(id: string\) => \{[\s\S]*?setInbox\(\(prev\) => prev\.map\(\(item\) => \(item\.id === id \? \{ \.\.\.item, unread: false \} : item\)\)\);",
    r"""const markInboxItemAsRead = (id: string) => {
    const itemToRead = inbox.find((item) => item.id === id);
    if (!itemToRead) return;

    setInbox((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    supabase.from('inbox').update({ unread: false }).eq('id', id).then();""",
    content
)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)

print("Patch applied successfully")
