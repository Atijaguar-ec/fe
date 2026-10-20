import os
import re

app_dir = '/Users/alvarosanchez/proyectos/giz/fe/apps/inatrace-fe/src/app'

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace @import 'string'; or @import "string"; with @use 'string' as *;
    # Excludes http://, https://, and url(...)
    new_content = re.sub(r'@import\s+([\'"])(?!https?://)(?!url\()([^\'"]+)\1\s*;', r'@use "\2" as *;', content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

modified = 0
for root, dirs, files in os.walk(app_dir):
    for file in files:
        if file.endswith('.scss'):
            if process_file(os.path.join(root, file)):
                modified += 1

print(f"Modified {modified} files")
