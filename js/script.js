// ============================================================
// DATA & STATE
// ============================================================
let transactions = [];
let chartInstance = null;

// ============================================================
// DOM ELEMENTS
// ============================================================
const form = document.getElementById('transactionForm');
const tbody = document.getElementById('transactionBody');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const exportBtn = document.getElementById('exportBtn');
const themeToggle = document.getElementById('themeToggle');

// ============================================================
// LOAD DATA
// ============================================================
function loadData() {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        try {
            transactions = JSON.parse(saved);
            if (!Array.isArray(transactions)) throw new Error('Data bukan array');
        } catch (e) {
            transactions = [];
            saveData();
        }
    } else {
        // Data contoh (bersih, tanpa error)
        transactions = [];
        saveData();
    }
}

function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ============================================================
// SET DEFAULT DATE
// ============================================================
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) dateInput.value = today;
}

// ============================================================
// RENDER TABLE (DIPERKUAT DENGAN PENGECEKAN)
// ============================================================
function renderTable(data = transactions) {
    console.log('Data yang akan dirender:', data); // Debug

    // Pastikan data adalah array
    if (!Array.isArray(data)) {
        console.error('Data bukan array!', data);
        data = [];
    }

    // Filter data
    const search = searchInput.value.toLowerCase().trim();
    const category = filterCategory.value;

    const filtered = data.filter(t => {
        if (!t || typeof t !== 'object') return false;
        const matchSearch = (t.desc || '').toLowerCase().includes(search);
        const matchCategory = category === 'all' || t.category === category;
        return matchSearch && matchCategory;
    });

    console.log('Data setelah difilter:', filtered); // Debug

    // Tampilkan pesan kalo kosong
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:30px;">Belum ada transaksi 😅</td></tr>`;
        return;
    }

    // Render tabel
    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td>${t.date || '-'}</td>
            <td>${t.desc || '-'}</td>
            <td>${t.category || '-'}</td>
            <td class="${t.type === 'income' ? 'income' : 'expense'}">Rp ${formatNumber(t.amount || 0)}</td>
            <td><button class="delete-btn" onclick="deleteTransaction('${t.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');

    console.log('Tabel berhasil dirender!'); // Debug
}

// ============================================================
// UPDATE SALDO & GRAFIK
// ============================================================
function updateStats() {
    const totalInc = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const balance = totalInc - totalExp;

    totalIncome.textContent = `Rp ${formatNumber(totalInc)}`;
    totalExpense.textContent = `Rp ${formatNumber(totalExp)}`;
    totalBalance.textContent = `Rp ${formatNumber(balance)}`;
}

function updateChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    const categories = ['Makanan', 'Transport', 'Hiburan', 'Pendidikan', 'Lainnya'];
    const amounts = categories.map(cat => {
        return transactions.filter(t => t.category === cat && t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    });

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: ['#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f87171'],
                borderColor: 'var(--bg-card)',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: 'var(--text-secondary)' } }
            }
        }
    });
}

// ============================================================
// HELPERS
// ============================================================
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 5);
}

// ============================================================
// CRUD OPERATIONS
// ============================================================
function addTransaction(e) {
    e.preventDefault();
    console.log('Form disubmit!');

    const desc = document.getElementById('desc').value.trim();
    const amount = parseInt(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;

    if (!desc || !amount || !date) {
        alert('Semua field wajib diisi!');
        return;
    }

    const newTransaction = {
        id: generateId(),
        date,
        desc,
        category,
        amount,
        type
    };

    transactions.push(newTransaction);
    saveData();
    renderAll();
    form.reset();
    setDefaultDate();
    console.log('Transaksi ditambahkan:', newTransaction);
}

function deleteTransaction(id) {
    if (!confirm('Hapus transaksi ini?')) return;
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    renderAll();
}

// ============================================================
// EXPORT CSV
// ============================================================
function exportCSV() {
    if (transactions.length === 0) return alert('Tidak ada data untuk diexport!');
    const headers = ['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah', 'Tipe'];
    const rows = transactions.map(t => [t.date, t.desc, t.category, t.amount, t.type]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================================
// RENDER ALL
// ============================================================
function renderAll() {
    renderTable();
    updateStats();
    updateChart();
}

// ============================================================
// EVENT LISTENERS
// ============================================================
form.addEventListener('submit', addTransaction);
searchInput.addEventListener('input', renderTable);
filterCategory.addEventListener('change', renderTable);
exportBtn.addEventListener('click', exportCSV);

// ============================================================
// DARK MODE TOGGLE
// ============================================================
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ============================================================
// INIT
// ============================================================
loadData();
renderAll();
setDefaultDate();

console.log('💰 Finance Dashboard ready!');
