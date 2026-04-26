// ==================== قاعدة البيانات والإصلاح التلقائي ====================
let db = {
    inventory: [],
    clients: [],
    suppliers: [],
    sales: [],
    purchases: [],
    expenses: [],
    revenues: [],
    settings: {}
};

function save(key) { localStorage.setItem(`bms_${key}`, JSON.stringify(db[key])); }
function loadDB() {
    ['inventory','clients','suppliers','sales','purchases','expenses','revenues','settings'].forEach(k => {
        try { let d = localStorage.getItem(`bms_${k}`); if(d) db[k] = JSON.parse(d); } catch(e){}
    });
}
function today() { return new Date().toLocaleDateString('ar-EG'); }
function notify(msg, type='success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = type === 'success' ? '#28a745' : type === 'danger' ? '#dc3545' : '#ffc107';
    toast.style.color = type === 'warning' ? '#333' : 'white';
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// إصلاح تلقائي للبيانات
function autoRepairData() {
    if (localStorage.getItem('bms_migration_done') === 'true') return;
    let fixes = { inventory:0, clients:0, suppliers:0, sales:0, purchases:0, expenses:0, revenues:0 };
    db.inventory = (db.inventory || []).map(item => {
        let changed = false;
        if (item.minQty === undefined) { item.minQty = 5; changed=true; }
        if (item.buyPrice === undefined) { item.buyPrice = 0; changed=true; }
        if (item.sellPrice === undefined) { item.sellPrice = 0; changed=true; }
        if (item.category === undefined) { item.category = 'عام'; changed=true; }
        if (item.qty === undefined) { item.qty = 0; changed=true; }
        if (changed) fixes.inventory++;
        return item;
    });
    db.clients = (db.clients || []).map(c => {
        let changed = false;
        if (c.totalPurchases === undefined) { c.totalPurchases = 0; changed=true; }
        if (c.debt === undefined) { c.debt = 0; changed=true; }
        if (c.phone === undefined) { c.phone = ''; changed=true; }
        if (c.email === undefined) { c.email = ''; changed=true; }
        if (c.address === undefined) { c.address = ''; changed=true; }
        if (c.status === undefined) { c.status = 'نشط'; changed=true; }
        if (changed) fixes.clients++;
        return c;
    });
    db.suppliers = (db.suppliers || []).map(s => {
        let changed = false;
        if (s.totalPurchases === undefined) { s.totalPurchases = 0; changed=true; }
        if (s.balance === undefined) { s.balance = 0; changed=true; }
        if (s.phone === undefined) { s.phone = ''; changed=true; }
        if (s.email === undefined) { s.email = ''; changed=true; }
        if (s.product === undefined) { s.product = ''; changed=true; }
        if (s.address === undefined) { s.address = ''; changed=true; }
        if (s.status === undefined) { s.status = 'نشط'; changed=true; }
        if (changed) fixes.suppliers++;
        return s;
    });
    db.sales = (db.sales || []).map(s => {
        let changed = false;
        if (s.clientName === undefined) { s.clientName = s.client || 'نقدي'; changed=true; }
        if (s.total === undefined) { s.total = (s.qty||0)*(s.price||0); changed=true; }
        if (s.paid === undefined) { s.paid = 0; changed=true; }
        if (s.status === undefined) { s.status = s.paid >= s.total ? 'مدفوع' : (s.paid>0 ? 'جزئي' : 'آجل'); changed=true; }
        if (s.date === undefined) { s.date = today(); changed=true; }
        if (changed) fixes.sales++;
        return s;
    });
    db.purchases = (db.purchases || []).map(p => {
        let changed = false;
        if (p.total === undefined) { p.total = (p.qty||0)*(p.price||0); changed=true; }
        if (p.paid === undefined) { p.paid = p.status === 'مدفوع' ? p.total : 0; changed=true; }
        if (p.remaining === undefined) { p.remaining = p.total - p.paid; changed=true; }
        if (p.status === undefined) { p.status = p.paid >= p.total ? 'مدفوع' : (p.paid>0 ? 'جزئي' : 'آجل'); changed=true; }
        if (p.date === undefined) { p.date = today(); changed=true; }
        if (changed) fixes.purchases++;
        return p;
    });
    db.expenses = (db.expenses || []).map(e => {
        let changed = false;
        if (e.type === undefined) { e.type = 'عام'; changed=true; }
        if (e.amount === undefined) { e.amount = 0; changed=true; }
        if (e.date === undefined) { e.date = today(); changed=true; }
        if (changed) fixes.expenses++;
        return e;
    });
    db.revenues = (db.revenues || []).map(r => {
        let changed = false;
        if (r.type === undefined) { r.type = 'عام'; changed=true; }
        if (r.amount === undefined) { r.amount = 0; changed=true; }
        if (r.date === undefined) { r.date = today(); changed=true; }
        if (changed) fixes.revenues++;
        return r;
    });
    ['inventory','clients','suppliers','sales','purchases','expenses','revenues','settings'].forEach(k => save(k));
    localStorage.setItem('bms_migration_done', 'true');
    if (fixes.inventory+fixes.clients+fixes.suppliers+fixes.sales+fixes.purchases+fixes.expenses+fixes.revenues > 0) notify('🛠️ تم إصلاح البيانات تلقائياً', 'info');
}

// ==================== التبويبات والمحتوى الديناميكي ====================
const sections = ['dashboard','inventory','sales','purchases','clients','suppliers','expenses','revenues','reports'];
const titles = {
    dashboard: '🏠 لوحة التحكم',
    inventory: '📦 المخزون',
    sales: '🛒 المبيعات',
    purchases: '📥 المشتريات',
    clients: '👥 العملاء',
    suppliers: '🏭 الموردين',
    expenses: '💸 المصروفات',
    revenues: '💰 الإيرادات',
    reports: '📊 التقارير'
};

function renderTabs() {
    const tabsDiv = document.getElementById('tabsContainer');
    tabsDiv.innerHTML = sections.map(s => `<div class="tab" data-tab="${s}">${titles[s]}</div>`).join('');
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            switchSection(tab.dataset.tab);
        });
    });
    document.querySelector('.tab')?.classList.add('active');
    switchSection('dashboard');
}

function switchSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    let secDiv = document.getElementById(`section-${section}`);
    if(!secDiv) generateSection(section);
    secDiv = document.getElementById(`section-${section}`);
    secDiv.classList.add('active');
    if(section === 'dashboard') updateDashboard();
    if(section === 'inventory') renderInventoryTable();
    if(section === 'sales') renderSalesTable();
    if(section === 'purchases') renderPurchasesTable();
    if(section === 'clients') renderClientsTable();
    if(section === 'suppliers') renderSuppliersTable();
    if(section === 'expenses') renderExpensesTable();
    if(section === 'revenues') renderRevenuesTable();
    if(section === 'reports') renderReports();
}

function generateSection(section) {
    const container = document.getElementById('contentContainer');
    let html = '';
    if(section === 'dashboard') html = `<div class="stats-grid" id="statsGrid"></div><div class="stats-grid" id="chartsGrid" style="grid-template-columns:1fr 1fr;"></div><div id="lowStockAlerts" class="stats-grid"></div>`;
    else if(section === 'inventory') html = `<div style="margin-bottom:15px"><button class="btn btn-primary" onclick="showModal('addInventoryModal')">➕ منتج جديد</button><input type="text" id="searchInventory" placeholder="🔍 بحث..." style="width:200px;margin-right:10px"></div><div class="table-wrapper"><table class="data-table"><thead><tr><th>#</th><th>المنتج</th><th>الفئة</th><th>الكمية</th><th>سعر الشراء</th><th>سعر البيع</th><th>الربح</th><th>الحد الأدنى</th><th>إجراءات</th></tr></thead><tbody id="inventoryTableBody"></tbody></table></div>`;
    else if(section === 'sales') html = `<div style="margin-bottom:15px"><button class="btn btn-primary" onclick="showModal('addSaleModal')">➕ فاتورة بيع</button><input type="text" id="searchSales" placeholder="🔍 بحث..." style="width:200px;margin-right:10px"></div><div class="table-wrapper"><tr><thead><tr><th>#</th><th>التاريخ</th><th>العميل</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody id="salesTableBody"></tbody><tr></div>`;
    else if(section === 'purchases') html = `<div style="margin-bottom:15px"><button class="btn btn-primary" onclick="showModal('addPurchaseModal')">➕ أمر شراء</button><input type="text" id="searchPurchases" placeholder="🔍 بحث..." style="width:200px;margin-right:10px"></div><div class="table-wrapper"><table><thead><tr><th>#</th><th>التاريخ</th><th>المورد</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody id="purchasesTableBody"></tbody></table></div>`;
    else if(section === 'clients') html = `<div style="margin-bottom:15px"><button class="btn btn-primary" onclick="showModal('addClientModal')">➕ عميل جديد</button><input type="text" id="searchClients" placeholder="🔍 بحث..." style="width:200px;margin-right:10px"></div><div class="table-wrapper"><table><thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>إجمالي المشتريات</th><th>الديون</th><th>إجراءات</th></tr></thead><tbody id="clientsTableBody"></tbody><table></div>`;
    else if(section === 'suppliers') html = `<div style="margin-bottom:15px"><button class="btn btn-primary" onclick="showModal('addSupplierModal')">➕ مورد جديد</button><input type="text" id="searchSuppliers" placeholder="🔍 بحث..." style="width:200px;margin-right:10px"></div><div class="table-wrapper"><table><thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>المنتج</th><th>إجمالي المشتريات</th><th>إجراءات</th></tr></thead><tbody id="suppliersTableBody"></tbody></table></div>`;
    else if(section === 'expenses') html = `<div style="margin-bottom:15px"><button class="btn btn-primary" onclick="showModal('addExpenseModal')">➕ مصروف جديد</button><input type="text" id="searchExpenses" placeholder="🔍 بحث..." style="width:200px;margin-right:10px"></div><div class="table-wrapper"><tr><thead><tr><th>#</th><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظات</th><th>إجراءات</th></tr></thead><tbody id="expensesTableBody"></tbody></table></div>`;
    else if(section === 'revenues') html = `<div style="margin-bottom:15px"><button class="btn btn-primary" onclick="showModal('addRevenueModal')">➕ إيراد جديد</button><input type="text" id="searchRevenues" placeholder="🔍 بحث..." style="width:200px;margin-right:10px"></div><div class="table-wrapper"></table><thead><tr><th>#</th><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظات</th><th>إجراءات</th></tr></thead><tbody id="revenuesTableBody"></tbody></table></div>`;
    else if(section === 'reports') html = `<div id="reportContainer"></div>`;
    container.innerHTML += `<div id="section-${section}" class="section">${html}</div>`;
}

// ==================== لوحة التحكم والرسوم البيانية ====================
function updateDashboard() {
    const totalSales = (db.sales || []).reduce((s,i)=>s+(i.total||0),0);
    const totalPurchases = (db.purchases || []).reduce((s,i)=>s+(i.total||0),0);
    const totalExpenses = (db.expenses || []).reduce((s,i)=>s+(i.amount||0),0);
    const totalRevenues = (db.revenues || []).reduce((s,i)=>s+(i.amount||0),0);
    const netProfit = totalSales - totalPurchases - totalExpenses + totalRevenues;
    const lowStock = (db.inventory || []).filter(i => (i.qty||0) <= (i.minQty||5)).length;
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="value">${totalSales.toLocaleString()} ج</div><div class="label">إجمالي المبيعات</div></div>
        <div class="stat-card"><div class="value">${totalPurchases.toLocaleString()} ج</div><div class="label">إجمالي المشتريات</div></div>
        <div class="stat-card"><div class="value">${totalExpenses.toLocaleString()} ج</div><div class="label">المصروفات</div></div>
        <div class="stat-card"><div class="value">${totalRevenues.toLocaleString()} ج</div><div class="label">الإيرادات</div></div>
        <div class="stat-card"><div class="value" style="color:${netProfit>=0?'#28a745':'#dc3545'}">${netProfit.toLocaleString()} ج</div><div class="label">صافي الربح</div></div>
        <div class="stat-card"><div class="value">${(db.inventory||[]).length}</div><div class="label">المنتجات</div></div>
        <div class="stat-card"><div class="value">${lowStock}</div><div class="label">منتجات منخفضة</div></div>
        <div class="stat-card"><div class="value">${(db.clients||[]).length}</div><div class="label">العملاء</div></div>
    `;
    drawCharts();
    const alertsDiv = document.getElementById('lowStockAlerts');
    if(lowStock>0) alertsDiv.innerHTML = `<div class="stat-card"><div class="value">⚠️ تنبيه</div><div class="label">${lowStock} منتج بحاجة لإعادة تخزين</div></div>`;
    else alertsDiv.innerHTML = '';
}
function drawCharts() {
    const chartsHtml = `<div style="background:#f8f9fa;border-radius:15px;padding:15px;"><canvas id="salesChart" height="200"></canvas></div><div style="background:#f8f9fa;border-radius:15px;padding:15px;"><canvas id="categoryChart" height="200"></canvas></div>`;
    document.getElementById('chartsGrid').innerHTML = chartsHtml;
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    let monthly = Array(12).fill(0);
    (db.sales || []).forEach(s => { let d = new Date(s.date); if(!isNaN(d)) monthly[d.getMonth()] += s.total || 0; });
    new Chart(document.getElementById('salesChart'), { type:'bar', data:{ labels:months, datasets:[{ label:'المبيعات', data:monthly, backgroundColor:'#1e3c72' }] }, options:{ responsive:true, maintainAspectRatio:true } });
    let cats = {};
    (db.inventory || []).forEach(i => { let c = i.category || 'عام'; cats[c] = (cats[c]||0) + (i.qty||0)*(i.sellPrice||0); });
    new Chart(document.getElementById('categoryChart'), { type:'doughnut', data:{ labels:Object.keys(cats), datasets:[{ data:Object.values(cats), backgroundColor:['#ffc107','#28a745','#17a2b8','#dc3545','#6f42c1'] }] }, options:{ responsive:true } });
}

// ==================== وظائف المخزون ====================
function resetInventorySaveBtn() {
    const btn = document.getElementById('inventorySaveBtn');
    if (btn) { btn.textContent = '💾 حفظ'; btn.onclick = addInventory; }
}
function renderInventoryTable() { 
    let data = db.inventory || []; 
    let search = document.getElementById('searchInventory')?.value.toLowerCase()||''; 
    if(search) data = data.filter(i=>i.name.toLowerCase().includes(search)); 
    let tbody = document.getElementById('inventoryTableBody'); 
    if(!tbody) return; 
    tbody.innerHTML = data.map((i,idx)=>`<td>
        <td>${idx+1}</td>
        <td>${i.name}</td>
        <td>${i.category||'-'}</td>
        <td>${i.qty}</td>
        <td>${(i.buyPrice||0).toLocaleString()} ج</td>
        <td>${(i.sellPrice||0).toLocaleString()} ج</td>
        <td>${(((i.sellPrice||0)-(i.buyPrice||0))*i.qty).toLocaleString()} ج</td>
        <td>${i.minQty||5}</td>
        <td><button class="btn btn-sm btn-warning" onclick="editInventory(${i.id})">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteInventory(${i.id})">🗑️</button></td>
     `).join(''); 
}
function addInventory(){ 
    let name=document.getElementById('invName').value, cat=document.getElementById('invCategory').value, qty=parseInt(document.getElementById('invQty').value), buy=parseFloat(document.getElementById('invBuy').value), sell=parseFloat(document.getElementById('invSell').value), min=parseInt(document.getElementById('invMin').value)||5; 
    if(!name||isNaN(qty)||isNaN(buy)||isNaN(sell)){ notify('املأ الحقول','danger'); return; } 
    db.inventory.push({id:Date.now(),name,category:cat,qty,buyPrice:buy,sellPrice:sell,minQty:min}); 
    save('inventory'); renderInventoryTable(); updateDashboard(); closeModal('addInventoryModal'); notify('تمت الإضافة'); resetInventorySaveBtn(); 
}
function editInventory(id){ 
    let item=db.inventory.find(i=>i.id===id); if(!item)return; 
    document.getElementById('invName').value=item.name; 
    document.getElementById('invCategory').value=item.category||''; 
    document.getElementById('invQty').value=item.qty; 
    document.getElementById('invBuy').value=item.buyPrice; 
    document.getElementById('invSell').value=item.sellPrice; 
    document.getElementById('invMin').value=item.minQty||5; 
    let saveBtn=document.getElementById('inventorySaveBtn'); 
    saveBtn.textContent='💾 تحديث'; saveBtn.onclick=()=>updateInventory(item.id); 
    showModal('addInventoryModal'); 
}
function updateInventory(id){ 
    let idx=db.inventory.findIndex(i=>i.id===id); if(idx===-1)return; 
    db.inventory[idx]={...db.inventory[idx], name:document.getElementById('invName').value, category:document.getElementById('invCategory').value, qty:parseInt(document.getElementById('invQty').value), buyPrice:parseFloat(document.getElementById('invBuy').value), sellPrice:parseFloat(document.getElementById('invSell').value), minQty:parseInt(document.getElementById('invMin').value)||5 }; 
    save('inventory'); renderInventoryTable(); updateDashboard(); closeModal('addInventoryModal'); notify('تم التحديث'); resetInventorySaveBtn(); 
}
function deleteInventory(id){ if(confirm('حذف المنتج؟')){ db.inventory=db.inventory.filter(i=>i.id!==id); save('inventory'); renderInventoryTable(); updateDashboard(); notify('تم الحذف','danger'); } }

// ==================== المبيعات ====================
function renderSalesTable(){ let data=db.sales||[]; let tbody=document.getElementById('salesTableBody'); if(!tbody)return; tbody.innerHTML=data.map((s,idx)=>`<tr>
    <td>${idx+1}</td>
    <td>${s.date}</td>
    <td>${s.clientName}</td>
    <td>${(s.total||0).toLocaleString()} ج</td>
    <td>${(s.paid||0).toLocaleString()} ج</td>
    <td>${((s.total||0)-(s.paid||0)).toLocaleString()} ج</td>
    <td><span style="background:${s.status==='مدفوع'?'#28a745':s.status==='جزئي'?'#fd7e14':'#dc3545'};color:white;padding:2px 8px;border-radius:20px">${s.status}</span></td>
    <td><button class="btn btn-sm btn-info" onclick="viewSale(${s.id})">🧾</button> <button class="btn btn-sm btn-warning" onclick="editSale(${s.id})">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteSale(${s.id})">🗑️</button></td>
     `).join(''); }
function addSale(){ let client=document.getElementById('saleClient').value, total=parseFloat(document.getElementById('saleTotal').value), paid=parseFloat(document.getElementById('salePaid').value)||0, date=document.getElementById('saleDate').value||today(); if(!client||isNaN(total)){ notify('املأ الحقول','danger'); return; } let status=paid>=total?'مدفوع':paid>0?'جزئي':'آجل'; db.sales.push({id:Date.now(), clientName:client, total, paid, status, date}); save('sales'); renderSalesTable(); updateDashboard(); closeModal('addSaleModal'); notify('تمت الإضافة'); }
function viewSale(id){ let s=db.sales.find(s=>s.id===id); if(!s)return; notify(`فاتورة: ${s.clientName} - ${s.total} ج - تاريخ ${s.date}`,'info'); }
function editSale(id){ alert('تعديل المبيعات قيد التطوير'); }
function deleteSale(id){ if(confirm('حذف البيع؟')){ db.sales=db.sales.filter(s=>s.id!==id); save('sales'); renderSalesTable(); updateDashboard(); notify('تم الحذف','danger'); } }

// ==================== المشتريات ====================
function renderPurchasesTable(){ let data=db.purchases||[]; let tbody=document.getElementById('purchasesTableBody'); if(!tbody)return; tbody.innerHTML=data.map((p,idx)=>`<tr>
    <td>${idx+1}</td>
    <td>${p.date}</td>
    <td>${p.supplier}</td>
    <td>${p.product}</td>
    <td>${p.qty}</td>
    <td>${p.price}</td>
    <td>${p.total}</td>
    <td>${p.status}</td>
    <td><button class="btn btn-sm btn-danger" onclick="deletePurchase(${p.id})">🗑️</button></td>
     `).join(''); }
function addPurchase(){ let supplier=document.getElementById('purchaseSupplier').value, product=document.getElementById('purchaseProduct').value, qty=parseInt(document.getElementById('purchaseQty').value), price=parseFloat(document.getElementById('purchasePrice').value), date=document.getElementById('purchaseDate').value||today(); if(!supplier||!product||isNaN(qty)||isNaN(price)){ notify('املأ الحقول','danger'); return; } let total=qty*price; db.purchases.push({id:Date.now(), supplier,product,qty,price,total,status:'مدفوع',date}); save('purchases'); renderPurchasesTable(); updateDashboard(); closeModal('addPurchaseModal'); notify('تمت الإضافة'); }
function deletePurchase(id){ if(confirm('حذف الشراء؟')){ db.purchases=db.purchases.filter(p=>p.id!==id); save('purchases'); renderPurchasesTable(); updateDashboard(); notify('تم الحذف','danger'); } }

// ==================== العملاء ====================
function renderClientsTable(){ let data=db.clients||[]; let tbody=document.getElementById('clientsTableBody'); if(!tbody)return; tbody.innerHTML=data.map((c,idx)=>`<tr>
    <td>${idx+1}</td>
    <td>${c.name}</td>
    <td>${c.phone||'-'}</td>
    <td>${c.email||'-'}</td>
    <td>${(c.totalPurchases||0).toLocaleString()} ج</td>
    <td>${(c.debt||0).toLocaleString()} ج</td>
    <td><button class="btn btn-sm btn-warning" onclick="editClient(${c.id})">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteClient(${c.id})">🗑️</button></td>
     `).join(''); }
function addClient(){ let name=document.getElementById('clientName').value; if(!name){ notify('أدخل اسم العميل','danger'); return; } db.clients.push({id:Date.now(), name, phone:'', email:'', totalPurchases:0, debt:0}); save('clients'); renderClientsTable(); updateDashboard(); closeModal('addClientModal'); notify('تمت الإضافة'); }
function editClient(id){ alert('تعديل العميل قيد التطوير'); }
function deleteClient(id){ if(confirm('حذف العميل؟')){ db.clients=db.clients.filter(c=>c.id!==id); save('clients'); renderClientsTable(); updateDashboard(); notify('تم الحذف','danger'); } }

// ==================== الموردين ====================
function renderSuppliersTable(){ let data=db.suppliers||[]; let tbody=document.getElementById('suppliersTableBody'); if(!tbody)return; tbody.innerHTML=data.map((s,idx)=>`<tr>
    <td>${idx+1}</td>
    <td>${s.name}</td>
    <td>${s.phone||'-'}</td>
    <td>${s.email||'-'}</td>
    <td>${s.product||'-'}</td>
    <td>${(s.totalPurchases||0).toLocaleString()} ج</td>
    <td><button class="btn btn-sm btn-warning" onclick="editSupplier(${s.id})">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${s.id})">🗑️</button></td>
     `).join(''); }
function addSupplier(){ let name=document.getElementById('supplierName').value; if(!name){ notify('أدخل اسم المورد','danger'); return; } db.suppliers.push({id:Date.now(), name, phone:'', email:'', product:'', totalPurchases:0}); save('suppliers'); renderSuppliersTable(); updateDashboard(); closeModal('addSupplierModal'); notify('تمت الإضافة'); }
function editSupplier(id){ alert('تعديل المورد قيد التطوير'); }
function deleteSupplier(id){ if(confirm('حذف المورد؟')){ db.suppliers=db.suppliers.filter(s=>s.id!==id); save('suppliers'); renderSuppliersTable(); updateDashboard(); notify('تم الحذف','danger'); } }

// ==================== المصروفات والإيرادات ====================
function renderExpensesTable(){ let data=db.expenses||[]; let tbody=document.getElementById('expensesTableBody'); if(!tbody)return; tbody.innerHTML=data.map((e,idx)=>`<tr>
    <td>${idx+1}</td>
    <td>${e.date}</td>
    <td>${e.type}</td>
    </table>
    <td><button class="btn btn-sm btn-danger" onclick="deleteExpense(${e.id})">🗑️</button></td>
    </tr>`).join(''); }
function addExpense(){ let type=document.getElementById('expenseType').value, amount=parseFloat(document.getElementById('expenseAmount').value), date=document.getElementById('expenseDate').value||today(); if(!type||isNaN(amount)){ notify('املأ الحقول','danger'); return; } db.expenses.push({id:Date.now(), type, amount, date}); save('expenses'); renderExpensesTable(); updateDashboard(); closeModal('addExpenseModal'); notify('تمت الإضافة'); }
function deleteExpense(id){ if(confirm('حذف المصروف؟')){ db.expenses=db.expenses.filter(e=>e.id!==id); save('expenses'); renderExpensesTable(); updateDashboard(); notify('تم الحذف','danger'); } }

function renderRevenuesTable(){ let data=db.revenues||[]; let tbody=document.getElementById('revenuesTableBody'); if(!tbody)return; tbody.innerHTML=data.map((r,idx)=>`<tr>
    <td>${idx+1}</td>
    <td>${r.date}</td>
    <td>${r.type}</td>
    <td>${r.amount}</td>
    <td>${r.note||'-'}</td>
    <td><button class="btn btn-sm btn-danger" onclick="deleteRevenue(${r.id})">🗑️</button></td>
    </tr>`).join(''); }
function addRevenue(){ let type=document.getElementById('revenueType').value, amount=parseFloat(document.getElementById('revenueAmount').value), date=document.getElementById('revenueDate').value||today(); if(!type||isNaN(amount)){ notify('املأ الحقول','danger'); return; } db.revenues.push({id:Date.now(), type, amount, date}); save('revenues'); renderRevenuesTable(); updateDashboard(); closeModal('addRevenueModal'); notify('تمت الإضافة'); }
function deleteRevenue(id){ if(confirm('حذف الإيراد؟')){ db.revenues=db.revenues.filter(r=>r.id!==id); save('revenues'); renderRevenuesTable(); updateDashboard(); notify('تم الحذف','danger'); } }

// ==================== التقارير ====================
function renderReports(){ 
    document.getElementById('reportContainer').innerHTML = `<div class="stats-grid">
        <div class="stat-card"><div class="value">${(db.sales||[]).reduce((s,i)=>s+(i.total||0),0).toLocaleString()} ج</div><div class="label">إجمالي المبيعات</div></div>
        <div class="stat-card"><div class="value">${(db.purchases||[]).reduce((s,i)=>s+(i.total||0),0).toLocaleString()} ج</div><div class="label">إجمالي المشتريات</div></div>
        <div class="stat-card"><div class="value">${((db.sales||[]).reduce((s,i)=>s+(i.total||0),0) - (db.purchases||[]).reduce((s,i)=>s+(i.total||0),0)).toLocaleString()} ج</div><div class="label">مجمل الربح</div></div>
        <div class="stat-card"><div class="value">${(db.clients||[]).reduce((s,c)=>s+(c.debt||0),0).toLocaleString()} ج</div><div class="label">ديون العملاء</div></div>
    </div><canvas id="reportChart" height="200"></canvas>`;
    let ctx = document.getElementById('reportChart').getContext('2d');
    let months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    let salesData = Array(12).fill(0), purchasesData=Array(12).fill(0);
    (db.sales||[]).forEach(s=>{ let d=new Date(s.date); if(!isNaN(d)) salesData[d.getMonth()]+=s.total||0; });
    (db.purchases||[]).forEach(p=>{ let d=new Date(p.date); if(!isNaN(d)) purchasesData[d.getMonth()]+=p.total||0; });
    new Chart(ctx, { type:'line', data:{ labels:months, datasets:[{ label:'المبيعات', data:salesData, borderColor:'#1e3c72' },{ label:'المشتريات', data:purchasesData, borderColor:'#dc3545' }] }, options:{ responsive:true } });
}

// ==================== وظائف مساعدة ====================
function showModal(id){ document.getElementById(id).classList.add('show'); }
function closeModal(id){
    const modal = document.getElementById(id);
    if(modal) modal.classList.remove('show');
    if(id === 'addInventoryModal') resetInventorySaveBtn();
}
function exportBackup(){ let data = JSON.stringify(db); let blob = new Blob([data],{type:'application/json'}); let url=URL.createObjectURL(blob); let a=document.createElement('a'); a.href=url; a.download=`backup_${today()}.json`; a.click(); notify('تم تصدير النسخة الاحتياطية'); }
function importDB(){ let input=document.createElement('input'); input.type='file'; input.accept='.json'; input.onchange=e=>{ let file=e.target.files[0]; let reader=new FileReader(); reader.onload=ev=>{ try{ let data=JSON.parse(ev.target.result); Object.assign(db,data); ['inventory','clients','suppliers','sales','purchases','expenses','revenues','settings'].forEach(k=>save(k)); renderAll(); notify('تم الاستيراد بنجاح'); }catch(err){ notify('ملف غير صالح','danger'); } }; reader.readAsText(file); }; input.click(); }
function clearAllData(){ if(confirm('مسح كل البيانات؟ لا يمكن التراجع!')){ ['inventory','clients','suppliers','sales','purchases','expenses','revenues','settings'].forEach(k=>{ db[k]=[]; save(k); }); renderAll(); notify('تم مسح جميع البيانات','danger'); } }
function renderAll(){ updateDashboard(); renderInventoryTable(); renderSalesTable(); renderPurchasesTable(); renderClientsTable(); renderSuppliersTable(); renderExpensesTable(); renderRevenuesTable(); renderReports(); }

// ==================== التهيئة العامة ====================
function initApp() {
    loadDB();
    autoRepairData();
    renderTabs();
    renderAll();
    document.getElementById('searchInventory')?.addEventListener('input', renderInventoryTable);
    document.getElementById('searchSales')?.addEventListener('input', renderSalesTable);
    document.getElementById('searchPurchases')?.addEventListener('input', renderPurchasesTable);
    document.getElementById('searchClients')?.addEventListener('input', renderClientsTable);
    document.getElementById('searchSuppliers')?.addEventListener('input', renderSuppliersTable);
    document.getElementById('searchExpenses')?.addEventListener('input', renderExpensesTable);
    document.getElementById('searchRevenues')?.addEventListener('input', renderRevenuesTable);
  }
