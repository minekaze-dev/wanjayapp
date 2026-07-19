import re

with open('server.ts', 'r') as f:
    content = f.read()

content = "import 'dotenv/config';\n" + content

with open('server.ts', 'w') as f:
    f.write(content)
