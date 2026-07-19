import re
with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("const __filename = fileURLToPath(import.meta.url);", "const __filename = typeof __filename !== 'undefined' ? __filename : (typeof require !== 'undefined' ? require('url').fileURLToPath(require('url').pathToFileURL(__filename).toString()) : '');")
content = content.replace("const __dirname = path.dirname(__filename);", "const __dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filename);")

with open('server.ts', 'w') as f:
    f.write(content)
