const db = require('../../config/database');
const MasterModel = require('./MasterModel');

class AssetModel {
    static async getAllAssets() {
        const [rows] = await db.query(
            `SELECT a.*, COALESCE(mi.code, a.asset_code) as asset_code, t.transaction_code 
             FROM fixed_assets a 
             LEFT JOIN master_items mi ON a.name = mi.name
             LEFT JOIN transactions t ON a.transaction_id = t.id 
             ORDER BY a.created_at DESC`
        );
        return rows;
    }

    static async createAsset(data) {
        let category = data.category;
        const [miRows] = await db.query(`SELECT code, category FROM master_items WHERE name = ? LIMIT 1`, [data.name]);
        if (miRows.length > 0) {
            category = category || miRows[0].category;
        }
        category = category || 'Peralatan & Mesin';

        const sourceOrigin = data.source_origin || 'Pembelian';
        const qty = Math.max(1, parseInt(data.qty) || 1);
        const totalCost = parseFloat(data.cost || 0);
        const unitCost = qty > 0 ? (totalCost / qty) : totalCost;

        let firstInsertId = null;

        for (let i = 0; i < qty; i++) {
            let assetCode = await MasterModel.getNextCodeForCategory(category);

            const [result] = await db.query(
                `INSERT INTO fixed_assets (asset_code, name, brand, model_no_plate, category, source_origin, purchase_date, cost, condition_status, location, description, transaction_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    assetCode, 
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
        if (!category && data.name) {
            const [miRows] = await db.query(`SELECT category FROM master_items WHERE name = ? LIMIT 1`, [data.name]);
            category = miRows[0]?.category;
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
