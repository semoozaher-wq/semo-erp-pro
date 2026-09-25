window.semoFirebaseConfig = {
            apiKey: "AIzaSyC2EVpNEG9XjcPEelUA8lkIUcUceN6Oh0k",
            authDomain: "semo-erp-pro13.firebaseapp.com",
            databaseURL: "https://semo-erp-pro13-default-rtdb.firebaseio.com",
            projectId: "semo-erp-pro13",
            storageBucket: "semo-erp-pro13.firebasestorage.app",
            messagingSenderId: "915256659491",
            appId: "1:915256659491:web:242f82ba1cfaee4b7c6b96"
        };
window.SEMOO_CONFIG = {
            appName: "SeMo0o FRP",
            firebaseProject: window.semoFirebaseConfig.projectId,
            // مفتاح VAPID الخاص بإشعارات الويب. ليس سرًّا، لكن اتركه فارغًا حتى تُنشئه.
            // الخطوات: Firebase Console ← Cloud Messaging ← Web Push certificates ← Generate key pair
            // ثم الصق المفتاح هنا. إن بقي فارغًا، تُعطَّل الإشعارات بهدوء دون أي خطأ.
            vapidKey: ""
        };
