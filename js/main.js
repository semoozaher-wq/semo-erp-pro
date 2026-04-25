import { initializeApp } from "https://gstatic.com";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://gstatic.com";
import { getDatabase, ref, set, get, child } from "https://gstatic.com";

// الإعدادات التي أرسلتها (المشروع الفعلي حالياً)
const firebaseConfig = {
  apiKey: "AIzaSyC2EVpNEG9XjcPEelUA8lkIUcUceN6Oh0k",
  authDomain: "semo-erp-pro13.firebaseapp.com",
  databaseURL: "https://semo-erp-pro13-default-rtdb.firebaseio.com",
  projectId: "semo-erp-pro13",
  storageBucket: "semo-erp-pro13.firebasestorage.app",
  messagingSenderId: "915256659491",
  appId: "1:915256659491:web:3726522d17e9ea5c7c6b96"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// دالة التبديل بين واجهة الدخول والتسجيل
window.toggle = () => {
    document.getElementById('login-box').classList.toggle('hidden');
    document.getElementById('signup-box').classList.toggle('hidden');
};

// دالة إنشاء حساب (يربط الإيميل برقم الهاتف)
window.signup = async () => {
    const e = document.getElementById('s-e').value;
    const p = document.getElementById('s-p').value;
    const ph = document.getElementById('s-ph').value;

    if(!e || !p || !ph) return alert("أكمل البيانات");

    try {
        // 1. إنشاء الحساب في Authentication
        await createUserWithEmailAndPassword(auth, e, p);
        
        // 2. تخزين رابط (الهاتف -> الإيميل) في Database
        await set(ref(db, 'users_map/' + ph), { email: e });
        
        alert("تم إنشاء حسابك بنجاح!");
        window.location.href = "dashboard.html";
    } catch (err) {
        alert("خطأ في الإنشاء: " + err.message);
    }
};

// دالة تسجيل الدخول (تقبل إيميل أو رقم هاتف)
window.login = async () => {
    const id = document.getElementById('l-id').value;
    const p = document.getElementById('l-p').value;

    if(!id || !p) return alert("أدخل البيانات");

    try {
        let email = id;

        // إذا كان المدخل رقم هاتف (لا يحتوي على @)
        if (!id.includes('@')) {
            const snapshot = await get(child(ref(db), `users_map/${id}`));
            if (snapshot.exists()) {
                email = snapshot.val().email;
            } else {
                throw new Error("رقم الهاتف غير مسجل لدينا");
            }
        }

        // تسجيل الدخول النهائي
        await signInWithEmailAndPassword(auth, email, p);
        window.location.href = "dashboard.html";
    } catch (err) {
        alert("فشل الدخول: " + err.message);
    }
};
