importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC2EVpNEG9XjcPEelUA8lkIUcUceN6Oh0k',
  authDomain: 'semo-erp-pro13.firebaseapp.com',
  databaseURL: 'https://semo-erp-pro13-default-rtdb.firebaseio.com',
  projectId: 'semo-erp-pro13',
  storageBucket: 'semo-erp-pro13.firebasestorage.app',
  messagingSenderId: '915256659491',
  appId: '1:915256659491:web:242f82ba1cfaee4b7c6b96'
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  self.registration.showNotification(notification.title || 'SeMo0o FRP', {
    body: notification.body || 'لديك تحديث جديد في النظام',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: payload.data || {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => 'focus' in client);
    if (existing) return existing.focus();
    return clients.openWindow('./index.html');
  }));
});
