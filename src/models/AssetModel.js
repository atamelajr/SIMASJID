const db = require('../../config/database');

class AssetModel {
    static async getAllAssets() {
        const [rows] = await db.query(
            `SELECT a.*, t.transaction_code 
             FROM fixed_assets a 
             LEFT JOIN transactions t ON a.transaction_id = t.id 
             ORDER BY a.created_at DESC`
        );
        return rows;
    }

    static async createAsset(data) {
        const assetCode = `AST-${Date.now()}`;
        let category = data.category;
        if (!category && data.name) {
            const [miRows] = await db.query(`SELECT category FROM master_items WHERE name = ? LIMIT 1`, [data.name]);
            category = miRows[0]?.category;
        }
        category = category || 'Peralatan & Mesin';

        const [result] = await db.query(
            `INSERT INTO fixed_assets (asset_code, name, brand, model_no_plate, category, purchase_date, cost, condition_status, location, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                assetCode, 
                data.name, 
                data.brand || null, 
                data.model_no_plate || null, 
                category,
                data.purchase_date || new Date(), 
                data.cost || 0, 
                data.condition_status || 'Baik', 
                data.location || 'Masjid',
                data.description || null
            ]
        );
        return result.insertId;
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
             SET name = ?, brand = ?, model_no_plate = ?, category = ?, purchase_date = ?, cost = ?, condition_status = ?, location = ?, description = ?
             WHERE id = ?`,
            [
                data.name,
                data.brand || null,
                data.model_no_plate || null,
                category,
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
