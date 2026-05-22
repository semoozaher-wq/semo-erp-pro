importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// ==================== Firebase Configuration ====================
firebase.initializeApp({
    apiKey: "AIzaSyCfVMHNoqbh86I0JJjnguGY6seA4vWJsSU",
    authDomain: "my-pos-system-11dee.firebaseapp.com",
    databaseURL: "https://my-pos-system-11dee-default-rtdb.firebaseio.com",
    projectId: "my-pos-system-11dee",
    storageBucket: "my-pos-system-11dee.firebasestorage.app",
    messagingSenderId: "565195477080",
    appId: "1:565195477080:web:1ffa21a34e28b47dddfa2d"
});

// ==================== Initialize Messaging ====================
const messaging = firebase.messaging();

// ==================== Handle Background Messages ====================
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || '📢 تنبيه جديد';
    const notificationBody = payload.notification?.body || 'لديك تحديث جديد في النظام';
    const notificationIcon = payload.notification?.icon || '/icon-192.png';
    const clickAction = payload.fcmOptions?.link || '/';
    
    const notificationOptions = {
        body: notificationBody,
        icon: notificationIcon,
        badge: '/badge-icon.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        silent: false,
        data: {
            clickAction: clickAction,
            ...payload.data
        },
        actions: [
            {
                action: 'open',
                title: '📱 فتح التطبيق'
            },
            {
                action: 'close',
                title: '❌ إغلاق'
            }
        ]
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// ==================== Handle Notification Click ====================
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received:', event);
    
    event.notification.close();
    
    const clickAction = event.notification.data?.clickAction || '/';
    const action = event.action;
    
    if (action === 'close') {
        // Close notification - do nothing
        return;
    }
    
    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there is already a window/tab open with the target URL
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes('/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If no window/tab is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(clickAction);
                }
            })
    );
});

// ==================== Handle Service Worker Installation ====================
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker installed');
    event.waitUntil(self.skipWaiting());
});

// ==================== Handle Service Worker Activation ====================
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker activated');
    event.waitUntil(self.clients.claim());
});

// ==================== Handle Push Events (Fallback) ====================
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push event received:', event);
    
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = {
                title: 'تنبيه جديد',
                body: event.data.text()
            };
        }
    }
    
    const title = data.title || '📢 تنبيه جديد';
    const options = {
        body: data.body || 'لديك تحديث جديد في النظام',
        icon: data.icon || '/icon-192.png',
        badge: '/badge-icon.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            clickAction: data.clickAction || '/'
        }
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
});

// ==================== Handle Push Subscription Change ====================
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[firebase-messaging-sw.js] Push subscription changed:', event);
    
    // Optionally, send the new subscription to your server
    event.waitUntil(
        messaging.getToken().then((token) => {
            console.log('[firebase-messaging-sw.js] New token:', token);
            // Send token to your server here
        })
    );
});
