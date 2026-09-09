const db = require('../../config/database');

class MasterModel {
    // === 1. KATEGORI & COA ===
    static async getNextCategoryCodes() {
        const [rowsPenerimaan] = await db.query(
            `SELECT account_code FROM categories WHERE type = 'Penerimaan' AND account_code REGEXP '^[0-9]+$' ORDER BY CAST(account_code AS UNSIGNED) DESC LIMIT 1`
        );
        const [rowsPengeluaran] = await db.query(
            `SELECT account_code FROM categories WHERE type = 'Pengeluaran' AND account_code REGEXP '^[0-9]+$' ORDER BY CAST(account_code AS UNSIGNED) DESC LIMIT 1`
        );

        let nextPenerimaan = 401;
        if (rowsPenerimaan.length > 0) {
            const num = parseInt(rowsPenerimaan[0].account_code);
            if (!isNaN(num)) nextPenerimaan = num + 1;
        }

        let nextPengeluaran = 501;
        if (rowsPengeluaran.length > 0) {
            const num = parseInt(rowsPengeluaran[0].account_code);
            if (!isNaN(num)) nextPengeluaran = num + 1;
        }

        return {
            Penerimaan: String(nextPenerimaan),
            Pengeluaran: String(nextPengeluaran)
        };
    }

    static async getAllCategories() {
        const [rows] = await db.query(`SELECT * FROM categories ORDER BY type ASC, account_code ASC`);
        return rows;
    }

    static async createCategory({ account_code, name, type, sub_type, description }) {
        let finalCode = account_code;
        if (!finalCode || finalCode.trim() === '') {
            const nextCodes = await this.getNextCategoryCodes();
            finalCode = nextCodes[type] || '401';
        }

        const [result] = await db.query(
            `INSERT INTO categories (account_code, name, type, sub_type, description) VALUES (?, ?, ?, ?, ?)`,
            [finalCode, name, type, sub_type, description || '']
        );
        return result.insertId;
    }

    static async updateCategory(id, { account_code, name, type, sub_type, description }) {
        await db.query(
            `UPDATE categories SET account_code=?, name=?, type=?, sub_type=?, description=? WHERE id=?`,
            [account_code, name, type, sub_type, description || '', id]
        );
    }

    static async deleteCategory(id) {
        await db.query(`DELETE FROM categories WHERE id=?`, [id]);
    }

    // === 2. REKENING KAS & BANK ===
    static async getAllAccounts() {
        const [rows] = await db.query(`SELECT * FROM cash_accounts ORDER BY id ASC`);
        return rows;
    }

    static async createAccount({ code, name, bank_name, account_number, account_holder, description, balance }) {
        const [result] = await db.query(
            `INSERT INTO cash_accounts (code, name, bank_name, account_number, account_holder, description, balance) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [code, name, bank_name || 'Kas Tunai', account_number || '-', account_holder || 'DKM Masjid', description || '', balance || 0]
        );
        return result.insertId;
    }

    static async updateAccount(id, { code, name, bank_name, account_number, account_holder, description, balance }) {
        await db.query(
            `UPDATE cash_accounts SET code=?, name=?, bank_name=?, account_number=?, account_holder=?, description=?, balance=? WHERE id=?`,
            [code, name, bank_name, account_number, account_holder, description, balance || 0, id]
        );
    }

    static async deleteAccount(id) {
        await db.query(`DELETE FROM cash_accounts WHERE id=?`, [id]);
    }

    // === 3. SATUAN BARANG ===
    static async getAllUnits() {
        const [rows] = await db.query(`SELECT * FROM units ORDER BY code ASC`);
        return rows;
    }

    static async createUnit({ code, name }) {
        const [result] = await db.query(
            `INSERT INTO units (code, name) VALUES (?, ?)`,
            [code, name]
        );
        return result.insertId;
    }

    static async updateUnit(id, { code, name }) {
        await db.query(
            `UPDATE units SET code=?, name=? WHERE id=?`,
            [code, name, id]
        );
    }

    static async deleteUnit(id) {
        await db.query(`DELETE FROM units WHERE id=?`, [id]);
    }

    // === 4. KATALOG BARANG & MATERIAL ===
    static async getNextItemCodes() {
        const [rowsAset] = await db.query(
            `SELECT code FROM master_items WHERE type = 'Aset' AND code LIKE 'ITM-AST-%' ORDER BY id DESC LIMIT 1`
        );
        const [rowsMaterial] = await db.query(
            `SELECT code FROM master_items WHERE type = 'Material' AND code LIKE 'ITM-MAT-%' ORDER BY id DESC LIMIT 1`
        );

        let nextAsetNum = 1;
        if (rowsAset.length > 0) {
            const lastCode = rowsAset[0].code;
            const parts = lastCode.split('-');
            const num = parseInt(parts[parts.length - 1]);
            if (!isNaN(num)) nextAsetNum = num + 1;
        }

        let nextMaterialNum = 1;
        if (rowsMaterial.length > 0) {
            const lastCode = rowsMaterial[0].code;
            const parts = lastCode.split('-');
            const num = parseInt(parts[parts.length - 1]);
            if (!isNaN(num)) nextMaterialNum = num + 1;
        }

        const pad = (n) => String(n).padStart(2, '0');

        return {
            Aset: `ITM-AST-${pad(nextAsetNum)}`,
            Material: `ITM-MAT-${pad(nextMaterialNum)}`
        };
    }

    static async getAllMasterItems(typeFilter = null) {
        let sql = `
            SELECT m.*, u.code as unit_code, u.name as unit_name 
            FROM master_items m 
            LEFT JOIN units u ON m.unit_id = u.id 
            WHERE m.is_active = 1
        `;
        const params = [];
        if (typeFilter) {
            sql += ` AND m.type = ?`;
            params.push(typeFilter);
        }
        sql += ` ORDER BY m.type ASC, m.name ASC`;
        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async createMasterItem({ code, name, type, unit_id, category, description }) {
        let finalCode = code;
        if (!finalCode || finalCode.trim() === '') {
            const nextCodes = await this.getNextItemCodes();
            finalCode = nextCodes[type] || `ITM-${Date.now()}`;
        }

        const [result] = await db.query(
            `INSERT INTO master_items (code, name, type, unit_id, category, description) VALUES (?, ?, ?, ?, ?, ?)`,
            [finalCode, name, type, unit_id || null, category || 'Operasional', description || '']
        );
        return result.insertId;
    }

    static async updateMasterItem(id, { code, name, type, unit_id, category, description }) {
        await db.query(
            `UPDATE master_items SET code=?, name=?, type=?, unit_id=?, category=?, description=? WHERE id=?`,
            [code, name, type, unit_id || null, category || 'Operasional', description || '', id]
        );
    }

    static async deleteMasterItem(id) {
        await db.query(`DELETE FROM master_items WHERE id=?`, [id]);
    }

    // === 5. DONATUR & MUSTAHIK ===
    static async getDonorsMustahik(type = null) {
        let sql = `SELECT * FROM donors_mustahik`;
        const params = [];
        if (type) {
            sql += ` WHERE type = ?`;
            params.push(type);
        }
        sql += ` ORDER BY name ASC`;
        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async createDonorMustahik({ type, name, category, phone, address }) {
        const [result] = await db.query(
            `INSERT INTO donors_mustahik (type, name, category, phone, address) VALUES (?, ?, ?, ?, ?)`,
            [type, name, category || 'Perorangan', phone || '', address || '']
        );
        return result.insertId;
    }

    static async updateDonorMustahik(id, { type, name, category, phone, address }) {
        await db.query(
            `UPDATE donors_mustahik SET type=?, name=?, category=?, phone=?, address=? WHERE id=?`,
            [type, name, category || 'Perorangan', phone || '', address || '', id]
        );
    }

    static async deleteDonorMustahik(id) {
        await db.query(`DELETE FROM donors_mustahik WHERE id=?`, [id]);
    }
}

module.exports = MasterModel;
