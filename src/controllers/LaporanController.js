const LaporanModel = require('../models/LaporanModel');
const TransactionModel = require('../models/TransactionModel');

class LaporanController {
    // Default Route Handler
    static async index(req, res) {
        res.redirect('/laporan/posisi-keuangan');
    }

    // 1. Laporan Posisi Keuangan (Neraca ISAK 35)
    static async posisiKeuangan(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const data = await LaporanModel.getPosisiKeuanganSummary(startDate, endDate);

            res.render('laporan/posisi_keuangan', {
                title: 'Laporan Posisi Keuangan (Neraca ISAK 35)',
                activeSubmenu: 'posisi-keuangan',
                startDate: startDate || '',
                endDate: endDate || '',
                ...data
            });
        } catch (err) {
            console.error('Laporan Posisi Keuangan Error:', err);
            res.redirect('/dashboard');
        }
    }

    // 2. Laporan Penghasilan & Beban / Aktivitas (ISAK 35)
    static async aktivitas(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const data = await LaporanModel.getLaporanAktivitas(startDate, endDate);

            res.render('laporan/aktivitas', {
                title: 'Laporan Penghasilan & Beban (ISAK 35)',
                activeSubmenu: 'aktivitas',
                startDate: startDate || '',
                endDate: endDate || '',
                ...data
            });
        } catch (err) {
            console.error('Laporan Aktivitas Error:', err);
            res.redirect('/dashboard');
        }
    }

    // 3. Laporan Rekapitulasi Kas & Bank
    static async kas(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const report = await LaporanModel.getLaporanKasSummary(startDate, endDate);

            res.render('laporan/kas', {
                title: 'Laporan Rekening Kas & Bank',
                activeSubmenu: 'kas',
                startDate: startDate || '',
                endDate: endDate || '',
                accountsReport: report
            });
        } catch (err) {
            console.error('Laporan Kas Error:', err);
            res.redirect('/dashboard');
        }
    }

    // 4. Laporan Mutasi Kas (Buku Kas / Ledger)
    static async mutasiKas(req, res) {
        try {
            const { startDate, endDate, account_id, type } = req.query;
            const transactions = await LaporanModel.getLaporanMutasiKas({ startDate, endDate, account_id, type });
            const accounts = await TransactionModel.getAccounts();

            res.render('laporan/mutasi_kas', {
                title: 'Laporan Mutasi Kas (Buku Besar Kas)',
                activeSubmenu: 'mutasi-kas',
                startDate: startDate || '',
                endDate: endDate || '',
                selectedAccount: account_id || '',
                selectedType: type || '',
                accounts,
                transactions
            });
        } catch (err) {
            console.error('Laporan Mutasi Kas Error:', err);
            res.redirect('/dashboard');
        }
    }

    // 5. Laporan Inventaris & Aset Tetap
    static async inventaris(req, res) {
        try {
            const { condition, search } = req.query;
            const data = await LaporanModel.getLaporanInventaris({ condition, search });

            res.render('laporan/inventaris', {
                title: 'Laporan Inventaris & Aset Tetap',
                activeSubmenu: 'inventaris',
                selectedCondition: condition || '',
                search: search || '',
                ...data
            });
        } catch (err) {
            console.error('Laporan Inventaris Error:', err);
            res.redirect('/dashboard');
        }
    }

    // 6. Laporan Persediaan / Material
    static async persediaan(req, res) {
        try {
            const { category, search } = req.query;
            const data = await LaporanModel.getLaporanPersediaan({ category, search });

            res.render('laporan/persediaan', {
                title: 'Laporan Persediaan Material',
                activeSubmenu: 'persediaan',
                selectedCategory: category || '',
                search: search || '',
                ...data
            });
        } catch (err) {
            console.error('Laporan Persediaan Error:', err);
            res.redirect('/dashboard');
        }
    }
}

module.exports = LaporanController;
