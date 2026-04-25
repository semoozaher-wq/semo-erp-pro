// دالة التبديل بين واجهة الدخول والحساب الجديد
function toggle() {
    const loginBox = document.getElementById('login-box');
    const signupBox = document.getElementById('signup-box');
    
    if (loginBox.classList.contains('hidden')) {
        loginBox.classList.remove('hidden');
        signupBox.classList.add('hidden');
    } else {
        loginBox.classList.add('hidden');
        signupBox.classList.remove('hidden');
    }
}

// دالة تسجيل الدخول (مجرد مثال توضيحي)
function login() {
    const id = document.getElementById('l-id').value;
    const password = document.getElementById('l-p').value;

    if (!id || !password) {
        alert('يرجى ملء جميع الحقول');
        return;
    }

    // هنا تضع منطق الاتصال بالسيرفر
    console.log('جاري تسجيل الدخول ببيانات:', { id, password });
    alert('تم إرسال بيانات تسجيل الدخول (تحتاج لربطها بقاعدة البيانات)');
}

// دالة إنشاء حساب جديد (مجرد مثال توضيحي)
function signup() {
    const email = document.getElementById('s-e').value;
    const phone = document.getElementById('s-ph').value;
    const password = document.getElementById('s-p').value;

    if (!email || !phone || !password) {
        alert('يرجى ملء جميع الحقول');
        return;
    }

    // تحقق بسيط من صحة البريد الإلكتروني
    if (!email.includes('@') || !email.includes('.')) {
        alert('البريد الإلكتروني غير صحيح');
        return;
    }

    // هنا تضع منطق الاتصال بالسيرفر
    console.log('جاري إنشاء حساب ببيانات:', { email, phone, password });
    alert('تم إرسال طلب إنشاء حساب (تحتاج لربطه بقاعدة البيانات)');
}
