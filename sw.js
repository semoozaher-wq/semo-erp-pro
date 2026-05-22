importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCfVMHNoqbh86I0JJjnguGY6seA4vWJsSU",
    authDomain: "my-pos-system-11dee.firebaseapp.com",
    databaseURL: "https://my-pos-system-11dee-default-rtdb.firebaseio.com",
    projectId: "my-pos-system-11dee",
    storageBucket: "my-pos-system-11dee.firebasestorage.app",
    messagingSenderId: "565195477080",
    appId: "1:565195477080:web:1ffa21a34e28b47dddfa2d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
    console.log('Received background message:', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});
