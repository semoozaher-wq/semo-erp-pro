import { initializeApp } from "https://gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://gstatic.com";

// الإعدادات المأخوذة من صورتك لمشروع pro13
const firebaseConfig = {
  apiKey: "AIzaSyC2VpNEG9XjcPEelUA8lkIUcUceN6Oh0k",
  authDomain: "://firebaseapp.com",
  databaseURL: "https://firebaseio.com",
  projectId: "semo-erp-pro13",
  storageBucket: "semo-erp-pro13.firebasestorage.app",
  messagingSenderId: "915256659491",
  appId: "1:915256659491:web:df0e768b7bf51027c6b96"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.toggle = () => {
    document.getElementById('login-box').classList.toggle('hidden');
    document.getElementById('signup-box').classList.toggle('hidden');
};

window.signup = async () => {
    const e = document.getElementById('s-e').value, p = document.getElementById('s-p').value;
    if(!e || !p) return alert("يرجى إدخال البريد وكلمة المرور");
    try {
        await createUserWithEmailAndPassword(auth, e, p);
        alert("تم إنشاء الحساب بنجاح!");
        window.location.href = "dashboard.html";
    } catch (err) { alert("خطأ: " + err.message); }
};

window.login = async () => {
    const e = document.getElementById('l-e').value, p = document.getElementById('l-p').value;
    if(!e || !p) return alert("أدخل البيانات");
    try {
        await signInWithEmailAndPassword(auth, e, p);
        window.location.href = "dashboard.html";
    } catch (err) { alert("فشل الدخول: تأكد من الإيميل والباسورد"); }
};
