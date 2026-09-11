const db = require('../../config/database');
const MasterModel = require('./MasterModel');

class AssetModel {
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

    static async getAllAssets() {
        const [rows] = await db.query(
            `SELECT a.*, mi.code as master_sku, t.transaction_code 
             FROM fixed_assets a 
             LEFT JOIN master_items mi ON a.name = mi.name
             LEFT JOIN transactions t ON a.transaction_id = t.id 
             ORDER BY a.created_at DESC`
        );
        return rows;
    }

    static async createAsset(data) {
        let category = data.category;
        let [miRows] = await db.query(`SELECT code, category FROM master_items WHERE name = ? LIMIT 1`, [data.name]);

        let baseSku;
        if (miRows.length > 0) {
            baseSku = miRows[0].code;
            category = category || miRows[0].category;
        } else {
            baseSku = await MasterModel.getNextCodeForCategory(category || 'Peralatan & Mesin');
            await db.query(
                `INSERT INTO master_items (code, name, type, category, description) VALUES (?, ?, 'Aset', ?, ?)`,
                [baseSku, data.name, category || 'Peralatan & Mesin', data.description || 'Auto-registered from Aset Input']
            );
        }
        category = category || 'Peralatan & Mesin';

        const sourceOrigin = data.source_origin || 'Pembelian';
        const qty = Math.max(1, parseInt(data.qty) || 1);
        const totalCost = parseFloat(data.cost || 0);
        const unitCosts = this.calculateUnitCosts(totalCost, qty);

        const [regRows] = await db.query(
            `SELECT MAX(register_no) as max_reg FROM fixed_assets WHERE name = ? OR asset_code LIKE ?`,
            [data.name, `${baseSku}.%`]
        );
        let startReg = regRows[0]?.max_reg || 0;

        let firstInsertId = null;

        for (let i = 0; i < qty; i++) {
            const regNo = startReg + 1 + i;
            const assetCode = `${baseSku}.${String(regNo).padStart(3, '0')}`;
            const unitCost = unitCosts[i];

            const [result] = await db.query(
                `INSERT INTO fixed_assets (asset_code, register_no, name, brand, model_no_plate, category, source_origin, purchase_date, cost, condition_status, location, description, transaction_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    assetCode,
                    regNo,
                    data.name, 
                    data.brand || null, 
                    data.model_no_plate || null, 
                    category,
                    sourceOrigin,
                    data.purchase_date || new Date(), 
                    unitCost, 
                    data.condition_status || 'Baik', 
                    data.location || 'Masjid',
                    data.description || null,
                    data.transaction_id || null
                ]
            );

            if (i === 0) firstInsertId = result.insertId;
        }

        return firstInsertId;
    }

    static async updateCondition(id, condition_status) {
        await db.query(
            `UPDATE fixed_assets SET condition_status = ? WHERE id = ?`,
            [condition_status, id]
        );
    }

    static async updateAssetDetail(id, data) {
        let category = data.category;
        let [miRows] = await db.query(`SELECT code, category FROM master_items WHERE name = ? LIMIT 1`, [data.name]);
        if (miRows.length > 0) {
            category = category || miRows[0].category;
        } else if (data.name) {
            let baseSku = await MasterModel.getNextCodeForCategory(category || 'Peralatan & Mesin');
            await db.query(
                `INSERT INTO master_items (code, name, type, category, description) VALUES (?, ?, 'Aset', ?, ?)`,
                [baseSku, data.name, category || 'Peralatan & Mesin', data.description || 'Auto-registered from Aset Edit']
            );
        }
        category = category || 'Peralatan & Mesin';

        await db.query(
            `UPDATE fixed_assets 
             SET name = ?, brand = ?, model_no_plate = ?, category = ?, source_origin = ?, purchase_date = ?, cost = ?, condition_status = ?, location = ?, description = ?
             WHERE id = ?`,
            [
                data.name,
                data.brand || null,
                data.model_no_plate || null,
                category,
                data.source_origin || 'Pembelian',
                data.purchase_date || null,
                data.cost || 0,
                data.condition_status || 'Baik',
                data.location || 'Masjid',
                data.description || null,
                id
            ]
        );
    }

    static async deleteAsset(id) {
        await db.query(`DELETE FROM fixed_assets WHERE id = ?`, [id]);
    }
}

module.exports = AssetModel;
