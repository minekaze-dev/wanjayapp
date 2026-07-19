import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

# 1. simulateReply inbox insert
content = re.sub(
    r"setInbox\(\(prev\) => \[newInboxItem, \.\.\.prev\]\);",
    r"""setInbox((prev) => [newInboxItem, ...prev]);
    supabase.from('inbox').insert({
      customer_name: newInboxItem.customerName,
      whatsapp_number: newInboxItem.whatsappNumber,
      last_message: newInboxItem.lastMessage,
      time_ago: newInboxItem.timeAgo,
      unread: newInboxItem.unread
    }).then();""",
    content
)

# 2. Add activity globally
# Find all setActivities((prev) => [newAct, ...prev.slice(0, 49)]);
content = re.sub(
    r"setActivities\(\(prev\) => \[([a-zA-Z0-9_]+), \.\.\.prev\.slice\(0, 49\)\]\);",
    r"""setActivities((prev) => [\1, ...prev.slice(0, 49)]);
    supabase.from('activities').insert({
      type: \1.type,
      content: \1.content,
      timestamp: \1.timestamp
    }).then();""",
    content
)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)

print("Patch 3 applied successfully")
