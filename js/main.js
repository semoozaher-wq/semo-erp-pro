import { initializeApp } from "https://gstatic.com";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://gstatic.com";
import { getDatabase, ref, set, get, child } from "https://gstatic.com";

// الإعدادات المحدثة بناءً على صورتك الأخيرة
const firebaseConfig = {
  apiKey: "AIzaSyCfVMHNoqbh86I0JJjnguGY6seA4vWJsSU",
  authDomain: "://firebaseapp.com",
  projectId: "semo-erp-pro13",
  storageBucket: "://appspot.com",
  messagingSenderId: "565195477080",
  appId: "1:565195477080:web:1ffa21a34e28b47dddfa2d",
  databaseURL: "https://firebaseio.com" // تم التعديل هنا
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

window.toggle = () => {
    document.getElementById('login-box').classList.toggle('hidden');
    document.getElementById('signup-box').classList.toggle('hidden');
};

window.signup = async () => {
    const e = document.getElementById('s-e').value, p = document.getElementById('s-p').value, ph = document.getElementById('s-ph').value;
    if(!e || !p || !ph) return alert("أكمل البيانات");
    try {
        await createUserWithEmailAndPassword(auth, e, p);
        await set(ref(db, 'users_map/' + ph), { email: e });
        alert("تم التسجيل بنجاح!");
        window.location.href = "dashboard.html";
    } catch (err) { alert("خطأ في الإنشاء: " + err.message); }
};

window.login = async () => {
    const id = document.getElementById('l-id').value, p = document.getElementById('l-p').value;
    if(!id || !p) return alert("أدخل البيانات");
    try {
        let email = id;
        if (!id.includes('@')) {
            const snapshot = await get(child(ref(db), `users_map/${id}`));
            if (snapshot.exists()) email = snapshot.val().email;
            else throw new Error("رقم الهاتف غير مسجل");
        }
        await signInWithEmailAndPassword(auth, email, p);
        window.location.href = "dashboard.html";
    } catch (err) { alert("فشل الدخول: " + err.message); }
};
