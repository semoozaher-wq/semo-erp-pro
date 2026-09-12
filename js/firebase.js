/* SeMo0o Firebase runtime: loaded before app.js. */
(() => {
    const firebaseConfig = window.semoFirebaseConfig;
    let app, db, auth, messaging, storage, accountAuth;
    try {
        app = firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        try { db.setPersistenceEnabled(true); } catch (persistenceError) { console.info('Firebase persistence already configured'); }
        auth = firebase.auth();
        storage = firebase.storage();
        // Separate auth instance: creating an employee must never sign out the manager.
        const accountApp = firebase.initializeApp(firebaseConfig, 'SeMo0oAccountProvisioning');
        accountAuth = accountApp.auth();
        if (typeof firebase.messaging !== 'undefined') messaging = firebase.messaging();
        const rawDatabaseRef = db.ref.bind(db);
        const workspaceCollections = new Set(['products','customers','suppliers','categories','sales','purchases','expenses','revenues','debts','supplierDebts','cashbox','returns','branches','settings','orders','activity','accountingEntries']);
        db.ref = function scopedDatabaseRef(path) {
            const value = typeof path === 'string' ? path : '';
            const root = value.split('/')[0];
            const uid = (typeof AppState !== 'undefined' && AppState.currentUser?.uid) || auth?.currentUser?.uid;
            if (uid && workspaceCollections.has(root) && !value.startsWith('users/')) {
                return rawDatabaseRef('users/' + uid + '/' + value);
            }
            return rawDatabaseRef(path);
        };
        console.log('✅ Firebase initialized successfully');
    } catch (e) {
        console.error('❌ Firebase initialization error:', e);
    }
    window.SemoFirebaseRuntime = { app, db, auth, messaging, storage, accountAuth };
})();
