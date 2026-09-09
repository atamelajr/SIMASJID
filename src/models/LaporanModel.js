const db = require('../../config/database');

class LaporanModel {
    /**
     * 1. Laporan Posisi Keuangan (Neraca - ISAK 35)
     */
    static async getPosisiKeuanganSummary(startDate = null, endDate = null) {
        // Aset Lancar: Rekening Kas & Bank
        const [cashRows] = await db.query(`
            SELECT id, code, name, bank_name, balance, description 
            FROM cash_accounts 
            WHERE is_active = 1
        `);

        const totalKasLancar = cashRows.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

        // Aset Lancar: Total Persediaan Material (Jumlah item persediaan * stok)
        const [invRows] = await db.query(`
            SELECT COUNT(*) as total_items, IFNULL(SUM(stock), 0) as total_stock 
            FROM inventory_items
        `);

        // Aset Tidak Lancar: Total Perolehan Aset Tetap / Inventaris Modal
        const [assetRows] = await db.query(`
            SELECT 
                COUNT(*) as total_assets, 
                IFNULL(SUM(cost), 0) as total_cost_assets,
                SUM(CASE WHEN condition_status = 'Baik' THEN 1 ELSE 0 END) as total_baik,
                SUM(CASE WHEN condition_status = 'Rusak Ringan' THEN 1 ELSE 0 END) as total_rusak_ringan,
                SUM(CASE WHEN condition_status = 'Rusak Berat' THEN 1 ELSE 0 END) as total_rusak_berat
            FROM fixed_assets
        `);

        const totalAsetTetap = parseFloat(assetRows[0].total_cost_assets || 0);
        const totalAset = totalKasLancar + totalAsetTetap;

        // Klasifikasi Aset Neto Sesuai ISAK 35 (Tanpa Pembatasan vs Dengan Pembatasan)
        // Kas ZIS, Sosial & Wakaf = Dengan Pembatasan (Restricted)
        // Kas Operasional & Bank Umum = Tanpa Pembatasan (Unrestricted)
        let asetNetoTanpaPembatasan = 0;
        let asetNetoDenganPembatasan = 0;

        cashRows.forEach(acc => {
            const isRestricted = acc.name.toLowerCase().includes('zis') || 
                               acc.name.toLowerCase().includes('sosial') || 
                               acc.name.toLowerCase().includes('pembangunan') ||
                               acc.name.toLowerCase().includes('wakaf');
            if (isRestricted) {
                asetNetoDenganPembatasan += parseFloat(acc.balance || 0);
            } else {
                asetNetoTanpaPembatasan += parseFloat(acc.balance || 0);
            }
        });

        // Aset Tetap termasuk Aset Neto Tanpa Pembatasan untuk Operasional Masjid
        asetNetoTanpaPembatasan += totalAsetTetap;

        return {
            cashAccounts: cashRows,
            totalKasLancar,
            totalAsetTetap,
            totalAset,
            inventorySummary: invRows[0],
            assetSummary: assetRows[0],
            asetNetoTanpaPembatasan,
            asetNetoDenganPembatasan,
            totalAsetNeto: asetNetoTanpaPembatasan + asetNetoDenganPembatasan
        };
    }

    /**
     * 2. Laporan Penghasilan & Beban / Aktivitas (ISAK 35)
     */
    static async getLaporanAktivitas(startDate = null, endDate = null) {
        let dateWhere = '';
        const params = [];

        if (startDate && endDate) {
            dateWhere = ' WHERE t.transaction_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else if (startDate) {
            dateWhere = ' WHERE t.transaction_date >= ?';
            params.push(startDate);
        } else if (endDate) {
            dateWhere = ' WHERE t.transaction_date <= ?';
            params.push(endDate);
        }

        // Rincian Penerimaan Per Kategori (Kas & Donasi Barang)
        const [penerimaanRows] = await db.query(`
            SELECT 
                c.account_code, c.name as category_name, c.sub_type,
                SUM(t.amount) as total_amount,
                SUM(CASE WHEN t.is_in_kind = 0 THEN t.amount ELSE 0 END) as total_kas,
                SUM(CASE WHEN t.is_in_kind = 1 THEN t.amount ELSE 0 END) as total_non_kas
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            ${dateWhere ? dateWhere + ' AND' : 'WHERE'} t.type = 'Penerimaan'
            GROUP BY c.id, c.account_code, c.name, c.sub_type
            ORDER BY c.account_code ASC
        `, params);

        // Rincian Pengeluaran Per Kategori
        const [pengeluaranRows] = await db.query(`
            SELECT 
                c.account_code, c.name as category_name, c.sub_type,
                SUM(t.amount) as total_amount
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            ${dateWhere ? dateWhere + ' AND' : 'WHERE'} t.type = 'Pengeluaran'
            GROUP BY c.id, c.account_code, c.name, c.sub_type
            ORDER BY c.account_code ASC
        `, params);

        const totalPenerimaan = penerimaanRows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
        const totalPengeluaran = pengeluaranRows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
        const surplusDefisit = totalPenerimaan - totalPengeluaran;

        return {
            penerimaanRows,
            pengeluaranRows,
            totalPenerimaan,
            totalPengeluaran,
            surplusDefisit
        };
    }

    /**
     * 3. Laporan Rekapitulasi Kas & Bank
     */
    static async getLaporanKasSummary(startDate = null, endDate = null) {
        const [accounts] = await db.query(`SELECT * FROM cash_accounts WHERE is_active = 1 ORDER BY id ASC`);
        
        let dateWhere = '';
        const params = [];

        if (startDate && endDate) {
            dateWhere = ' AND t.transaction_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const report = [];

        for (const acc of accounts) {
            // Calculate total mutasi penerimaan tunai/transfer untuk akun ini
            const [penerimaanRes] = await db.query(`
                SELECT IFNULL(SUM(amount), 0) as total
                FROM transactions t
                WHERE account_id = ? AND type = 'Penerimaan' AND is_in_kind = 0 ${dateWhere}
            `, [acc.id, ...params]);

            // Calculate total mutasi pengeluaran tunai/transfer untuk akun ini
            const [pengeluaranRes] = await db.query(`
                SELECT IFNULL(SUM(amount), 0) as total
                FROM transactions t
                WHERE account_id = ? AND type = 'Pengeluaran' AND is_in_kind = 0 ${dateWhere}
            `, [acc.id, ...params]);

            const totalIn = parseFloat(penerimaanRes[0].total || 0);
            const totalOut = parseFloat(pengeluaranRes[0].total || 0);

            report.push({
                ...acc,
                totalPenerimaan: totalIn,
                totalPengeluaran: totalOut,
                currentBalance: parseFloat(acc.balance || 0)
            });
        }

        return report;
    }

    /**
     * 4. Laporan Mutasi Kas (Buku Kas / Ledger dengan Running Balance)
     */
    static async getLaporanMutasiKas(filters = {}) {
        let sql = `
            SELECT t.*, c.name as category_name, c.account_code, ca.name as account_name, u.full_name as created_by_name
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            JOIN cash_accounts ca ON t.account_id = ca.id
            JOIN users u ON t.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.account_id) {
            sql += ` AND t.account_id = ?`;
            params.push(filters.account_id);
        }
        if (filters.type) {
            sql += ` AND t.type = ?`;
            params.push(filters.type);
        }
        if (filters.startDate && filters.endDate) {
            sql += ` AND t.transaction_date BETWEEN ? AND ?`;
            params.push(filters.startDate, filters.endDate);
        } else if (filters.startDate) {
            sql += ` AND t.transaction_date >= ?`;
            params.push(filters.startDate);
        } else if (filters.endDate) {
            sql += ` AND t.transaction_date <= ?`;
            params.push(filters.endDate);
        }

        sql += ` ORDER BY t.transaction_date ASC, t.id ASC`;
        const [rows] = await db.query(sql, params);

        // Calculate Running Balance
        let runningBalance = 0;
        const resultWithBalance = rows.map(row => {
            const amount = parseFloat(row.amount || 0);
            if (row.is_in_kind === 0) {
                if (row.type === 'Penerimaan') {
                    runningBalance += amount;
                } else {
                    runningBalance -= amount;
                }
            }
            return {
                ...row,
                runningBalance
            };
        });

        return resultWithBalance;
    }

    /**
     * 5. Laporan Inventaris & Aset Tetap
     */
    static async getLaporanInventaris(filters = {}) {
        let sql = `
            SELECT fa.*, t.transaction_code, t.donor_name
            FROM fixed_assets fa
            LEFT JOIN transactions t ON fa.transaction_id = t.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.condition) {
            sql += ` AND fa.condition_status = ?`;
            params.push(filters.condition);
        }
        if (filters.search) {
            sql += ` AND (fa.name LIKE ? OR fa.asset_code LIKE ? OR fa.location LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        sql += ` ORDER BY fa.purchase_date DESC, fa.id DESC`;
        const [rows] = await db.query(sql, params);

        const totalPerolehan = rows.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0);

        return {
            assets: rows,
            totalAssetsCount: rows.length,
            totalPerolehan
        };
    }

    /**
     * 6. Laporan Persediaan / Material
     */
    static async getLaporanPersediaan(filters = {}) {
        let sql = `
            SELECT ii.*, 
                (SELECT IFNULL(SUM(qty), 0) FROM inventory_logs WHERE item_id = ii.id AND type = 'Masuk') as total_masuk,
                (SELECT IFNULL(SUM(qty), 0) FROM inventory_logs WHERE item_id = ii.id AND type = 'Keluar') as total_keluar
            FROM inventory_items ii
            WHERE 1=1
        `;
        const params = [];

        if (filters.category) {
            sql += ` AND ii.category = ?`;
            params.push(filters.category);
        }
        if (filters.search) {
            sql += ` AND (ii.name LIKE ? OR ii.item_code LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        sql += ` ORDER BY ii.name ASC`;
        const [items] = await db.query(sql, params);

        // Fetch Recent Logs
        const [logs] = await db.query(`
            SELECT il.*, ii.name as item_name, ii.unit
            FROM inventory_logs il
            JOIN inventory_items ii ON il.item_id = ii.id
            ORDER BY il.created_at DESC LIMIT 20
        `);

        return {
            items,
            logs
        };
    }
}

module.exports = LaporanModel;
