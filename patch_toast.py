import re
with open('src/components/ToastContainer.tsx', 'r') as f:
    content = f.read()

content = content.replace("fixed top-20 md:top-auto", "fixed top-4 md:top-auto")
content = content.replace("w-[90vw] md:w-full max-w-sm", "w-full max-w-[calc(100vw-2rem)] md:max-w-sm mx-auto")

with open('src/components/ToastContainer.tsx', 'w') as f:
    f.write(content)
