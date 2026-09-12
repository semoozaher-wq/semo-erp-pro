from pathlib import Path
p = Path('/home/ubuntu/semo-erp-pro/index.html')
s = p.read_text()
old = """            console.log('✅ Firebase initialized successfully');
        } catch (e) {"""
new = """            // Scope every business collection to the signed-in user's workspace.
            // Existing UI code can keep using db.ref('products'), while the wrapper
            // transparently stores it at users/{uid}/products.
            const rawDatabaseRef = db.ref.bind(db);
            const workspaceCollections = new Set(['products','customers','suppliers','categories','sales','purchases','expenses','revenues','debts','supplierDebts','cashbox','returns','branches','settings','orders','activity','accountingEntries']);
            db.ref = function scopedDatabaseRef(path) {
                const value = typeof path === 'string' ? path : '';
                const root = value.split('/')[0];
                const uid = AppState?.currentUser?.uid || auth?.currentUser?.uid;
                if (uid && workspaceCollections.has(root) && !value.startsWith('users/')) {
                    return rawDatabaseRef('users/' + uid + '/' + value);
                }
                return rawDatabaseRef(path);
            };
            console.log('✅ Firebase initialized successfully');
        } catch (e) {"""
if old not in s:
    raise SystemExit('Firebase init anchor not found')
s = s.replace(old, new, 1)
old2 = """                    const usersSnapshot = await db.ref('users').once('value');
                    const isFirstUser = !usersSnapshot.exists() || Object.keys(usersSnapshot.val() || {}).length === 0;
                    await userRef.set({"""
new2 = """                    let isFirstUser = false;
                    try {
                        const usersSnapshot = await db.ref('users').once('value');
                        isFirstUser = !usersSnapshot.exists() || Object.keys(usersSnapshot.val() || {}).length === 0;
                    } catch (directoryError) {
                        // Non-admin users are intentionally not allowed to list the user directory.
                        // They are provisioned as cashier accounts instead of failing login.
                        console.info('User directory is private; provisioning a standard account.');
                    }
                    await userRef.set({"""
if old2 not in s:
    raise SystemExit('Google provisioning anchor not found')
s = s.replace(old2, new2, 1)
old3 = """        function initReliabilityLayer(){if(!window.indexedDB)return;document.getElementById('reliabilityTools')?.style.setProperty('display','grid');openLocalReliability().then(()=>{updatePendingCount();setTimeout(recoverLocalSnapshot,800)});setInterval(()=>saveLocalSnapshot('interval'),5*60*1000);window.addEventListener('online',()=>{updatePendingCount();processOfflineOutbox()});window.addEventListener('beforeunload',()=>{try{saveLocalSnapshot('beforeunload')}catch(e){}});if(!localStorage.getItem('semoo-beginner-guide-seen'))setTimeout(openBeginnerGuide,1200)}"""
new3 = """        function initReliabilityLayer(){if(!window.indexedDB)return;document.getElementById('reliabilityTools')?.style.setProperty('display','grid');openLocalReliability().then(()=>{updatePendingCount();setTimeout(recoverLocalSnapshot,800)});setInterval(()=>saveLocalSnapshot('interval'),5*60*1000);window.addEventListener('online',()=>{updatePendingCount();processOfflineOutbox()});window.addEventListener('beforeunload',()=>{try{saveLocalSnapshot('beforeunload')}catch(e){}});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){try{saveLocalSnapshot('visibilitychange')}catch(e){}}});if(!localStorage.getItem('semoo-beginner-guide-seen'))setTimeout(openBeginnerGuide,1200)}"""
if old3 in s:
    s = s.replace(old3, new3, 1)
p.write_text(s)
