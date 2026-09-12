from pathlib import Path
import re

root = Path('/home/ubuntu/semo-erp-pro')
index = root / 'index.html'
s = index.read_text()
style_match = re.search(r'\n\s*<style>\n([\s\S]*?)\n\s*</style>', s)
if not style_match:
    raise SystemExit('style block not found')
(root / 'css').mkdir(exist_ok=True)
(root / 'js').mkdir(exist_ok=True)
(root / 'css/main.css').write_text(style_match.group(1).lstrip() + '\n')
s = s[:style_match.start()] + '\n    <link rel="stylesheet" href="css/main.css">' + s[style_match.end():]
script_match = re.search(r'\n\s*<script>\n([\s\S]*?)\n\s*</script>\s*\n\s*</body>', s)
if not script_match:
    raise SystemExit('main script block not found')
app = script_match.group(1).lstrip() + '\n'
config_match = re.search(r'\s*const firebaseConfig = \{[\s\S]*?\n\s*\};', app)
if not config_match:
    raise SystemExit('firebase config block not found')
config_block = config_match.group(0)
config_object = re.search(r'const firebaseConfig = (\{[\s\S]*?\n\s*\});', config_block)
if not config_object:
    raise SystemExit('firebase config object not found')
(root / 'js/config.js').write_text('window.semoFirebaseConfig = ' + config_object.group(1) + ';\nwindow.SEMOO_CONFIG = { appName: "SeMo0o FRP", firebaseProject: window.semoFirebaseConfig.projectId };\n')
app = app.replace(config_block, '\n        const firebaseConfig = window.semoFirebaseConfig;')
# Move the Firebase initialization/scoping section to its own classic script.
init_start = app.find('        // Initialize Firebase')
init_end = app.find('        // ============================================\n        // === GLOBAL STATE MANAGEMENT ===', init_start)
if init_start == -1 or init_end == -1:
    raise SystemExit('firebase init boundaries not found')
init = app[init_start:init_end]
firebase = '''/* SeMo0o Firebase runtime: loaded before app.js. */\n''' + init
firebase = firebase.replace('        // Initialize Firebase', '        // Initialize Firebase')
(root / 'js/firebase.js').write_text(firebase)
app = app[:init_start] + '''        const { app, db, auth, messaging, storage, accountAuth } = window.SemoFirebaseRuntime;\n\n''' + app[init_end:]
# The init section begins with try and ends with the catch block; expose its values at the end.
firebase += '\nwindow.SemoFirebaseRuntime = { app, db, auth, messaging, storage, accountAuth };\n'
(root / 'js/firebase.js').write_text(firebase)
(root / 'js/app.js').write_text(app)
s = s[:script_match.start()] + '''\n    <script src="js/config.js"></script>\n    <script src="js/firebase.js"></script>\n    <script src="js/app.js"></script>\n''' + s[script_match.end():]
index.write_text(s)
