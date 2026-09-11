const db = require('../../config/database');
const MasterModel = require('./MasterModel');

class TransactionModel {
    /**
     * Pembagian Nilai Perolehan Aset Tetap:
     * Nilai barang dibulatkan ke ribuan terdekat (tanpa desimal),
     * sisa selisih pembagian ditambahkan ke unit barang terakhir.
     */
    static calculateUnitCosts(totalCost, qty) {
        const numQty = Math.max(1, parseInt(qty) || 1);
        const cost = parseFloat(totalCost || 0);

        let baseUnitCost;
        if (cost >= 1000 * numQty) {
            baseUnitCost = Math.floor((cost / numQty) / 1000) * 1000;
        } else {
            baseUnitCost = Math.floor(cost / numQty);
        }

        const totalAllocated = baseUnitCost * numQty;
        const remainder = cost - totalAllocated;

        const costs = [];
        for (let i = 0; i < numQty; i++) {
            if (i === numQty - 1) {
                costs.push(baseUnitCost + remainder);
            } else {
                costs.push(baseUnitCost);
            }
        }
        return costs;
    }
    static async getDashboardSummary() {
        const [cashRows] = await db.query(
            `SELECT SUM(balance) as total_saldo FROM cash_accounts`
        );
        const totalSaldo = cashRows[0].total_saldo || 0;

        // Pemasukan vs Pengeluaran Bulan Ini berdasarkan Tanggal Transaksi (Tunai/Transfer)
        const [monthlyStats] = await db.query(
            `SELECT 
                SUM(CASE WHEN type = 'Penerimaan' AND is_in_kind = 0 THEN amount ELSE 0 END) as total_penerimaan,
                SUM(CASE WHEN type = 'Pengeluaran' AND is_in_kind = 0 THEN amount ELSE 0 END) as total_pengeluaran
             FROM transactions
             WHERE MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())`
        );

        // Recent Activity Logs
        const [recentLogs] = await db.query(
            `SELECT a.*, u.full_name as user_name 
             FROM activity_logs a 
             LEFT JOIN users u ON a.user_id = u.id 
             ORDER BY a.created_at DESC LIMIT 5`
        );

        return {
            totalSaldo,
            totalPenerimaanBulanIni: monthlyStats[0].total_penerimaan || 0,
            totalPengeluaranBulanIni: monthlyStats[0].total_pengeluaran || 0,
            recentLogs
        };
    }

    static async getAllTransactions(filters = {}) {
        const result = await this.getPaginatedTransactions(filters, 1, 'all');
        return result.transactions;
    }

    static async getPaginatedTransactions(filters = {}, page = 1, limit = '10') {
        let whereSql = ` WHERE 1=1`;
        const params = [];

        if (filters.account_id) {
            whereSql += ` AND (t.account_id = ? OR t.target_account_id = ?)`;
            params.push(filters.account_id, filters.account_id);
        }
        if (filters.type) {
            whereSql += ` AND t.type = ?`;
            params.push(filters.type);
        }
        if (filters.payment_mode) {
            if (filters.payment_mode === 'Donasi Barang') {
                whereSql += ` AND (t.payment_mode = 'Donasi Barang' OR t.is_in_kind = 1)`;
            } else if (filters.payment_mode === 'Mutasi') {
                whereSql += ` AND t.type = 'Mutasi'`;
            } else {
                whereSql += ` AND t.payment_mode = ? AND t.is_in_kind = 0 AND t.type != 'Mutasi'`;
                params.push(filters.payment_mode);
            }
        }
        if (filters.start_date) {
            whereSql += ` AND t.transaction_date >= ?`;
            params.push(filters.start_date);
        }
        if (filters.end_date) {
            whereSql += ` AND t.transaction_date <= ?`;
            params.push(filters.end_date);
        }

        // Count Total Records matching filters
        const countSql = `
            SELECT COUNT(DISTINCT t.id) as total
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            JOIN cash_accounts ca ON t.account_id = ca.id
            JOIN users u ON t.created_by = u.id
            ${whereSql}
        `;
        const [countRows] = await db.query(countSql, params);
        const totalCount = countRows[0]?.total || 0;

        // Fetch paginated data with grouped asset/inventory subqueries to prevent duplicate transaction rows
        let sql = `
            SELECT t.*, c.name as category_name, c.sub_type, ca.name as account_name, tca.name as target_account_name, tca.code as target_account_code, pca.name as paid_account_name, u.full_name as created_by_name,
                   fa_summary.asset_id, fa_summary.asset_name, fa_summary.asset_qty, fa_summary.asset_condition, fa_summary.asset_location,
                   il_summary.inventory_log_id, il_summary.inventory_qty, il_summary.inventory_item_id, il_summary.inventory_name, il_summary.inventory_unit
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            JOIN cash_accounts ca ON t.account_id = ca.id
            LEFT JOIN cash_accounts tca ON t.target_account_id = tca.id
            JOIN users u ON t.created_by = u.id
            LEFT JOIN cash_accounts pca ON t.paid_account_id = pca.id
            LEFT JOIN (
                SELECT transaction_id, 
                       MIN(id) as asset_id, 
                       MAX(name) as asset_name, 
                       COUNT(*) as asset_qty, 
                       MAX(condition_status) as asset_condition, 
                       MAX(location) as asset_location
                FROM fixed_assets 
                WHERE transaction_id IS NOT NULL 
                GROUP BY transaction_id
            ) fa_summary ON fa_summary.transaction_id = t.id
            LEFT JOIN (
                SELECT il.transaction_id, 
                       MIN(il.id) as inventory_log_id, 
                       SUM(il.qty) as inventory_qty, 
                       MIN(ii.id) as inventory_item_id, 
                       MAX(ii.name) as inventory_name, 
                       MAX(ii.unit) as inventory_unit
                FROM inventory_logs il
                JOIN inventory_items ii ON ii.id = il.item_id
                WHERE il.transaction_id IS NOT NULL
                GROUP BY il.transaction_id
            ) il_summary ON il_summary.transaction_id = t.id
            ${whereSql}
            ORDER BY t.transaction_date DESC, t.id DESC
        `;

        let pageNum = parseInt(page) || 1;
        let limitNum = limit === 'all' ? (totalCount || 1) : (parseInt(limit) || 10);
        if (limitNum <= 0) limitNum = 10;
        
        let totalPages = limit === 'all' ? 1 : Math.ceil(totalCount / limitNum);
        if (totalPages === 0) totalPages = 1;

        if (limit !== 'all') {
            const offset = (pageNum - 1) * limitNum;
            sql += ` LIMIT ? OFFSET ?`;
            params.push(limitNum, offset);
        }

        const [transactions] = await db.query(sql, params);

        return {
            transactions,
            totalCount,
            page: pageNum,
            limit: limit.toString(),
            totalPages
        };
    }

    static async getAccounts() {
        const [rows] = await db.query(`SELECT * FROM cash_accounts WHERE is_active = 1 ORDER BY id ASC`);
        return rows;
    }

    static async getCategories(type = null) {
        let sql = `SELECT * FROM categories WHERE is_active = 1`;
        const params = [];
        if (type) {
            sql += ` AND type = ?`;
            params.push(type);
        }
        sql += ` ORDER BY name ASC`;
        const [rows] = await db.query(sql, params);
        return rows;
    }

    /**
     * Logic Inti: Input Transaksi (dengan Tanggal Transaksi Riil & Hutang)
     */
    static async createTransaction(data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const code = `TRX-${Date.now()}`;
            let { account_id, target_account_id, category_id, type, amount, description, donor_name, creditor_name, due_date, proof_file, asset_item, inventory_item } = data;
            const transactionDate = data.transaction_date || new Date().toISOString().split('T')[0];
            const isInKind = parseInt(data.is_in_kind || (data.payment_mode === 'Donasi Barang' ? 1 : 0));
            const paymentMode = type === 'Mutasi' ? 'Non-Tunai' : (isInKind === 1 ? 'Donasi Barang' : (data.payment_mode || 'Tunai'));
            const finalAmount = parseFloat(amount || 0);
            const targetAccountId = target_account_id ? parseInt(target_account_id) : null;

            let debtStatus = 'Lunas';
            if (paymentMode === 'Hutang') {
                debtStatus = 'Belum Lunas';
            }

            if (!account_id) {
                const [defaultAccount] = await connection.query(`SELECT id FROM cash_accounts LIMIT 1`);
                account_id = defaultAccount[0]?.id || 1;
            }

            if (type === 'Mutasi' && !category_id) {
                const [mutCat] = await connection.query(`SELECT id FROM categories WHERE account_code = '100' OR name LIKE '%Mutasi%' LIMIT 1`);
                category_id = mutCat[0]?.id || 1;
            }

            // 1. Insert Transaction
            const [trxResult] = await connection.query(
                `INSERT INTO transactions 
                 (transaction_code, transaction_date, account_id, target_account_id, category_id, type, payment_mode, is_in_kind, amount, description, donor_name, creditor_name, due_date, debt_status, proof_file, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [code, transactionDate, account_id, targetAccountId, category_id, type, paymentMode, isInKind, finalAmount, description, donor_name || null, creditor_name || null, due_date || null, debtStatus, proof_file || null, userId]
            );
            const transactionId = trxResult.insertId;

            // 2. Update Account Balance
            if (type === 'Mutasi') {
                await connection.query(
                    `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                    [finalAmount, account_id]
                );
                if (targetAccountId) {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                        [finalAmount, targetAccountId]
                    );
                }
            } else if (isInKind === 0 && paymentMode !== 'Hutang') {
                if (type === 'Penerimaan') {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                        [finalAmount, account_id]
                    );
                } else {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                        [finalAmount, account_id]
                    );
                }
            }

            // 3. Cek Kategori & Automasi Barang (Aset Tetap / Inventory)
            const [catRows] = await connection.query(`SELECT sub_type FROM categories WHERE id = ?`, [category_id]);
            const subType = catRows[0]?.sub_type;

            if ((subType === 'Modal' || asset_item) && asset_item && asset_item.name) {
                let [miRows] = await connection.query(`SELECT code, category FROM master_items WHERE name = ? LIMIT 1`, [asset_item.name]);
                const assetCategory = miRows[0]?.category || asset_item.category || 'Peralatan & Mesin';
                let baseSku;

                if (miRows.length > 0) {
                    baseSku = miRows[0].code;
                } else {
                    baseSku = await MasterModel.getNextCodeForCategory(assetCategory, connection);
                    await connection.query(
                        `INSERT INTO master_items (code, name, type, category, description) VALUES (?, ?, 'Aset', ?, ?)`,
                        [baseSku, asset_item.name, assetCategory, 'Auto-registered from Transaction']
                    );
                }

                const assetQty = Math.max(1, parseInt(asset_item.qty) || 1);
                const sourceOrigin = asset_item.source_origin || (isInKind === 1 || type === 'Penerimaan' ? 'Hibah' : 'Pembelian');
                const unitCosts = this.calculateUnitCosts(finalAmount, assetQty);

                const [regRows] = await connection.query(
                    `SELECT MAX(register_no) as max_reg FROM fixed_assets WHERE name = ? OR asset_code LIKE ?`,
                    [asset_item.name, `${baseSku}.%`]
                );
                let startReg = regRows[0]?.max_reg || 0;

                for (let i = 0; i < assetQty; i++) {
                    const regNo = startReg + 1 + i;
                    const assetCode = `${baseSku}.${String(regNo).padStart(3, '0')}`;
                    const unitCost = unitCosts[i];

                    await connection.query(
                        `INSERT INTO fixed_assets (asset_code, register_no, name, category, source_origin, purchase_date, cost, condition_status, location, transaction_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [assetCode, regNo, asset_item.name || description, assetCategory, sourceOrigin, transactionDate, unitCost, asset_item.condition || 'Baik', asset_item.location || 'Masjid', transactionId]
                    );
                }
            }

            if ((subType === 'Material' || inventory_item) && inventory_item && inventory_item.name) {
                let [miRows] = await connection.query(`SELECT code, category FROM master_items WHERE name = ? LIMIT 1`, [inventory_item.name]);
                const categoryType = inventory_item.category || miRows[0]?.category || 'Material dan Bahan Lainnya';
                let itemCode = inventory_item.code;

                if (miRows.length > 0) {
                    itemCode = miRows[0].code;
                } else {
                    if (!itemCode || itemCode.startsWith('INV-')) {
                        itemCode = await MasterModel.getNextCodeForCategory(categoryType, connection);
                    }
                    await connection.query(
                        `INSERT INTO master_items (code, name, type, category, description) VALUES (?, ?, 'Material', ?, ?)`,
                        [itemCode, inventory_item.name, categoryType, 'Auto-registered from Transaction']
                    );
                }
                
                const [existingItem] = await connection.query(
                    `SELECT id FROM inventory_items WHERE name = ? AND unit = ?`,
                    [inventory_item.name, inventory_item.unit]
                );

                let itemId;
                if (existingItem.length > 0) {
                    itemId = existingItem[0].id;
                    await connection.query(
                        `UPDATE inventory_items SET stock = stock + ?, item_code = COALESCE(?, item_code) WHERE id = ?`,
                        [inventory_item.qty, itemCode, itemId]
                    );
                } else {
                    const [invResult] = await connection.query(
                        `INSERT INTO inventory_items (item_code, name, unit, category, stock)
                         VALUES (?, ?, ?, ?, ?)`,
                        [itemCode, inventory_item.name, inventory_item.unit || 'pcs', categoryType, inventory_item.qty || 1]
                    );
                    itemId = invResult.insertId;
                }

                const logNotes = paymentMode === 'Hutang'
                    ? `Pembelian Kredit/Hutang (${inventory_item.qty} ${inventory_item.unit}) tgl ${transactionDate} dari ${creditor_name || 'Supplier'}`
                    : (isInKind === 1 
                        ? `Penerimaan Donasi Barang (${inventory_item.qty} ${inventory_item.unit}) tgl ${transactionDate} dari ${donor_name || 'Hamba Allah'}`
                        : `Pembelian tgl ${transactionDate} dari kas (${code})`);

                await connection.query(
                    `INSERT INTO inventory_logs (item_id, type, qty, notes, transaction_id)
                     VALUES (?, 'Masuk', ?, ?, ?)`,
                    [itemId, inventory_item.qty || 1, logNotes, transactionId]
                );
            }

            // Log Activity
            let logMsg = `Menambahkan transaksi ${type} ${code} tgl ${transactionDate} sebesar Rp ${finalAmount}`;
            if (paymentMode === 'Hutang') {
                logMsg = `Menambahkan transaksi belanja kredit/hutang ${code} tgl ${transactionDate} sebesar Rp ${finalAmount} ke ${creditor_name || 'Supplier'}`;
            } else if (isInKind === 1) {
                logMsg = `Menambahkan donasi barang (In-Kind) ${code} tgl ${transactionDate} dengan nilai Rp ${finalAmount}`;
            }

            await connection.query(
                `INSERT INTO activity_logs (user_id, action, details)
                 VALUES (?, 'TRANSACTION_CREATE', ?)`,
                [userId, logMsg]
            );

            await connection.commit();
            return transactionId;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    /**
     * Delete Transaction & Reverse Balance
     */
    static async deleteTransaction(id, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(`SELECT * FROM transactions WHERE id = ?`, [id]);
            if (rows.length === 0) {
                throw new Error('Transaksi tidak ditemukan');
            }
            const trx = rows[0];

            // Reverse Cash Balance ONLY IF NOT IN-KIND AND NOT UNPAID DEBT
            if (trx.type === 'Mutasi') {
                if (trx.account_id) {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                        [trx.amount, trx.account_id]
                    );
                }
                if (trx.target_account_id) {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                        [trx.amount, trx.target_account_id]
                    );
                }
            } else if (trx.is_in_kind === 0) {
                if (trx.payment_mode === 'Hutang') {
                    // Jika utang sudah lunas, kembalikan saldo kas pembayar (paid_account_id)
                    if (trx.debt_status === 'Lunas' && trx.paid_account_id) {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                            [trx.amount, trx.paid_account_id]
                        );
                    }
                } else {
                    if (trx.type === 'Penerimaan') {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                            [trx.amount, trx.account_id]
                        );
                    } else {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                            [trx.amount, trx.account_id]
                        );
                    }
                }
            }

            // Unlink or delete related asset/inventory records
            await connection.query(`DELETE FROM fixed_assets WHERE transaction_id = ?`, [id]);
            await connection.query(`DELETE FROM inventory_logs WHERE transaction_id = ?`, [id]);

            // Delete transaction row
            await connection.query(`DELETE FROM transactions WHERE id = ?`, [id]);

            // Log activity
            await connection.query(
                `INSERT INTO activity_logs (user_id, action, details)
                 VALUES (?, 'TRANSACTION_DELETE', ?)`,
                [userId, `Menghapus transaksi ${trx.transaction_code} (${trx.type}) sebesar Rp ${trx.amount}`]
            );

            await connection.commit();
            return true;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    /**
     * Update Transaction & Adjust Balances
     */
    static async updateTransaction(id, data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(`SELECT * FROM transactions WHERE id = ?`, [id]);
            if (rows.length === 0) {
                throw new Error('Transaksi tidak ditemukan');
            }
            const oldTrx = rows[0];

            // 1. Reverse old transaction's balance impact
            if (oldTrx.type === 'Mutasi') {
                if (oldTrx.account_id) {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                        [oldTrx.amount, oldTrx.account_id]
                    );
                }
                if (oldTrx.target_account_id) {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                        [oldTrx.amount, oldTrx.target_account_id]
                    );
                }
            } else if (oldTrx.is_in_kind === 0) {
                if (oldTrx.payment_mode === 'Hutang') {
                    if (oldTrx.debt_status === 'Lunas' && oldTrx.paid_account_id) {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                            [oldTrx.amount, oldTrx.paid_account_id]
                        );
                    }
                } else {
                    if (oldTrx.type === 'Penerimaan') {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                            [oldTrx.amount, oldTrx.account_id]
                        );
                    } else {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                            [oldTrx.amount, oldTrx.account_id]
                        );
                    }
                }
            }

            let { account_id, target_account_id, category_id, type, payment_mode, amount, description, donor_name, creditor_name, due_date, proof_file } = data;
            const transactionDate = data.transaction_date || oldTrx.transaction_date;
            const isInKind = parseInt(data.is_in_kind || (payment_mode === 'Donasi Barang' ? 1 : 0));
            const paymentMode = type === 'Mutasi' ? 'Non-Tunai' : (isInKind === 1 ? 'Donasi Barang' : (payment_mode || 'Tunai'));
            const finalAmount = parseFloat(amount || 0);
            const targetAccountId = target_account_id ? parseInt(target_account_id) : oldTrx.target_account_id;

            let debtStatus = oldTrx.debt_status || 'Lunas';
            if (paymentMode === 'Hutang' && oldTrx.payment_mode !== 'Hutang') {
                debtStatus = 'Belum Lunas';
            } else if (paymentMode !== 'Hutang') {
                debtStatus = 'Lunas';
            }

            if (!account_id) {
                const [defaultAccount] = await connection.query(`SELECT id FROM cash_accounts LIMIT 1`);
                account_id = defaultAccount[0]?.id || oldTrx.account_id;
            }

            if (type === 'Mutasi' && !category_id) {
                const [mutCat] = await connection.query(`SELECT id FROM categories WHERE account_code = '100' OR name LIKE '%Mutasi%' LIMIT 1`);
                category_id = mutCat[0]?.id || oldTrx.category_id;
            }

            const proof = proof_file || oldTrx.proof_file;

            // 2. Update transaction row
            await connection.query(
                `UPDATE transactions 
                 SET transaction_date = ?, account_id = ?, target_account_id = ?, category_id = ?, type = ?, payment_mode = ?, is_in_kind = ?, amount = ?, description = ?, donor_name = ?, creditor_name = ?, due_date = ?, debt_status = ?, proof_file = ?
                 WHERE id = ?`,
                [transactionDate, account_id, targetAccountId, category_id, type, paymentMode, isInKind, finalAmount, description, donor_name || null, creditor_name || null, due_date || null, debtStatus, proof, id]
            );

            // 3. Apply new transaction's balance impact
            if (type === 'Mutasi') {
                if (account_id) {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                        [finalAmount, account_id]
                    );
                }
                if (targetAccountId) {
                    await connection.query(
                        `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                        [finalAmount, targetAccountId]
                    );
                }
            } else if (isInKind === 0) {
                if (paymentMode === 'Hutang') {
                    if (debtStatus === 'Lunas' && oldTrx.paid_account_id) {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                            [finalAmount, oldTrx.paid_account_id]
                        );
                    }
                } else {
                    if (type === 'Penerimaan') {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance + ? WHERE id = ?`,
                            [finalAmount, account_id]
                        );
                    } else {
                        await connection.query(
                            `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                            [finalAmount, account_id]
                        );
                    }
                }
            }

            // 4. Sync linked Fixed Assets / Inventory
            const { asset_item, inventory_item } = data;
            const [catRows] = await connection.query(`SELECT sub_type FROM categories WHERE id = ?`, [category_id]);
            const subType = catRows[0]?.sub_type;

            if (asset_item && asset_item.name) {
                await connection.query(`DELETE FROM inventory_logs WHERE transaction_id = ?`, [id]);
                let [miRows] = await connection.query(`SELECT code, category FROM master_items WHERE name = ? LIMIT 1`, [asset_item.name]);
                const assetCategory = miRows[0]?.category || asset_item.category || 'Peralatan & Mesin';
                let baseSku;

                if (miRows.length > 0) {
                    baseSku = miRows[0].code;
                } else {
                    baseSku = await MasterModel.getNextCodeForCategory(assetCategory, connection);
                    await connection.query(
                        `INSERT INTO master_items (code, name, type, category, description) VALUES (?, ?, 'Aset', ?, ?)`,
                        [baseSku, asset_item.name, assetCategory, 'Auto-registered from Transaction Edit']
                    );
                }

                const [existingAsset] = await connection.query(`SELECT id, asset_code, register_no FROM fixed_assets WHERE transaction_id = ?`, [id]);
                if (existingAsset.length > 0) {
                    let regNo = existingAsset[0].register_no || 1;
                    let assetCode = `${baseSku}.${String(regNo).padStart(3, '0')}`;
                    await connection.query(
                        `UPDATE fixed_assets SET name = ?, asset_code = ?, category = ?, purchase_date = ?, cost = ?, condition_status = ?, location = ? WHERE id = ?`,
                        [asset_item.name, assetCode, assetCategory, transactionDate, finalAmount, asset_item.condition || 'Baik', asset_item.location || 'Masjid', existingAsset[0].id]
                    );
                } else {
                    const [regRows] = await connection.query(
                        `SELECT MAX(register_no) as max_reg FROM fixed_assets WHERE name = ? OR asset_code LIKE ?`,
                        [asset_item.name, `${baseSku}.%`]
                    );
                    let regNo = (regRows[0]?.max_reg || 0) + 1;
                    let assetCode = `${baseSku}.${String(regNo).padStart(3, '0')}`;
                    await connection.query(
                        `INSERT INTO fixed_assets (asset_code, register_no, name, category, purchase_date, cost, condition_status, location, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [assetCode, regNo, asset_item.name, assetCategory, transactionDate, finalAmount, asset_item.condition || 'Baik', asset_item.location || 'Masjid', id]
                    );
                }
            } else if (inventory_item && inventory_item.name) {
                await connection.query(`DELETE FROM fixed_assets WHERE transaction_id = ?`, [id]);
                let [miRows] = await connection.query(`SELECT code, category FROM master_items WHERE name = ? LIMIT 1`, [inventory_item.name]);
                const categoryType = inventory_item.category || miRows[0]?.category || 'Material dan Bahan Lainnya';
                let itemCode;

                if (miRows.length > 0) {
                    itemCode = miRows[0].code;
                } else {
                    itemCode = await MasterModel.getNextCodeForCategory(categoryType, connection);
                    await connection.query(
                        `INSERT INTO master_items (code, name, type, category, description) VALUES (?, ?, 'Material', ?, ?)`,
                        [itemCode, inventory_item.name, categoryType, 'Auto-registered from Transaction Edit']
                    );
                }
                
                const [existingItem] = await connection.query(
                    `SELECT id FROM inventory_items WHERE name = ? AND unit = ?`,
                    [inventory_item.name, inventory_item.unit]
                );

                let itemId;
                if (existingItem.length > 0) {
                    itemId = existingItem[0].id;
                    await connection.query(
                        `UPDATE inventory_items SET item_code = COALESCE(?, item_code) WHERE id = ?`,
                        [itemCode, itemId]
                    );
                } else {
                    const [invResult] = await connection.query(
                        `INSERT INTO inventory_items (item_code, name, unit, category, stock) VALUES (?, ?, ?, ?, ?)`,
                        [itemCode, inventory_item.name, inventory_item.unit || 'pcs', categoryType, 0]
                    );
                    itemId = invResult.insertId;
                }

                const newQty = inventory_item.qty || 1;
                const [existingLog] = await connection.query(
                    `SELECT id, item_id, qty FROM inventory_logs WHERE transaction_id = ?`,
                    [id]
                );

                if (existingLog.length > 0) {
                    const oldLog = existingLog[0];
                    const diffQty = newQty - oldLog.qty;
                    if (oldLog.item_id === itemId) {
                        await connection.query(`UPDATE inventory_items SET stock = stock + ? WHERE id = ?`, [diffQty, itemId]);
                    } else {
                        await connection.query(`UPDATE inventory_items SET stock = stock - ? WHERE id = ?`, [oldLog.qty, oldLog.item_id]);
                        await connection.query(`UPDATE inventory_items SET stock = stock + ? WHERE id = ?`, [newQty, itemId]);
                    }
                    const logNotes = paymentMode === 'Hutang'
                        ? `Pembelian Kredit/Hutang (${newQty} ${inventory_item.unit}) tgl ${transactionDate} dari ${creditor_name || 'Supplier'}`
                        : (isInKind === 1 
                            ? `Penerimaan Donasi Barang (${newQty} ${inventory_item.unit}) tgl ${transactionDate} dari ${donor_name || 'Hamba Allah'}`
                            : `Pembelian tgl ${transactionDate} dari kas`);

                    await connection.query(
                        `UPDATE inventory_logs SET item_id = ?, qty = ?, notes = ? WHERE id = ?`,
                        [itemId, newQty, logNotes, oldLog.id]
                    );
                } else {
                    await connection.query(`UPDATE inventory_items SET stock = stock + ? WHERE id = ?`, [newQty, itemId]);
                    const logNotes = paymentMode === 'Hutang'
                        ? `Pembelian Kredit/Hutang (${newQty} ${inventory_item.unit}) tgl ${transactionDate} dari ${creditor_name || 'Supplier'}`
                        : (isInKind === 1 
                            ? `Penerimaan Donasi Barang (${newQty} ${inventory_item.unit}) tgl ${transactionDate} dari ${donor_name || 'Hamba Allah'}`
                            : `Pembelian tgl ${transactionDate} dari kas`);

                    await connection.query(
                        `INSERT INTO inventory_logs (item_id, type, qty, notes, transaction_id) VALUES (?, 'Masuk', ?, ?, ?)`,
                        [itemId, newQty, logNotes, id]
                    );
                }
            }

            // Log Activity
            await connection.query(
                `INSERT INTO activity_logs (user_id, action, details)
                 VALUES (?, 'TRANSACTION_UPDATE', ?)`,
                [userId, `Mengubah transaksi ${oldTrx.transaction_code} menjadi ${type} sebesar Rp ${finalAmount}`]
            );

            await connection.commit();
            return true;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    /**
     * Pelunasan Utang Belanja
     */
    static async payDebt(id, paidAccountId, paymentDate, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(`SELECT * FROM transactions WHERE id = ?`, [id]);
            if (rows.length === 0) {
                throw new Error('Transaksi utang tidak ditemukan');
            }
            const trx = rows[0];

            if (trx.payment_mode !== 'Hutang') {
                throw new Error('Transaksi ini bukan transaksi belanja utang');
            }
            if (trx.debt_status === 'Lunas') {
                throw new Error('Utang ini sudah lunas sebelumnya');
            }

            const pDate = paymentDate || new Date().toISOString().split('T')[0];

            // 1. Potong saldo kas pembayar
            await connection.query(
                `UPDATE cash_accounts SET balance = balance - ? WHERE id = ?`,
                [trx.amount, paidAccountId]
            );

            // 2. Update status transaksi menjadi Lunas
            await connection.query(
                `UPDATE transactions 
                 SET debt_status = 'Lunas', paid_at = ?, paid_account_id = ?
                 WHERE id = ?`,
                [pDate, paidAccountId, id]
            );

            // 3. Log Activity
            const [accRows] = await connection.query(`SELECT name FROM cash_accounts WHERE id = ?`, [paidAccountId]);
            const accName = accRows[0]?.name || 'Kas';

            await connection.query(
                `INSERT INTO activity_logs (user_id, action, details)
                 VALUES (?, 'DEBT_PAYMENT', ?)`,
                [userId, `Pelunasan utang transaksi ${trx.transaction_code} sebesar Rp ${trx.amount} via ${accName}`]
            );

            await connection.commit();
            return true;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

module.exports = TransactionModel;
