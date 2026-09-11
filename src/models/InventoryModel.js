const db = require('../../config/database');

class InventoryModel {
    static async getAllItems() {
        const [rows] = await db.query(
            `SELECT ii.*, COALESCE(mi.code, ii.item_code) as item_code 
             FROM inventory_items ii
             LEFT JOIN master_items mi ON ii.name = mi.name
             ORDER BY ii.category ASC, ii.name ASC`
        );
        return rows;
    }

    static async getLogs() {
        const [rows] = await db.query(
            `SELECT l.*, i.name as item_name, i.unit, i.category
             FROM inventory_logs l
             JOIN inventory_items i ON l.item_id = i.id
             ORDER BY l.created_at DESC`
        );
        return rows;
    }

    static async recordUsage({ item_id, qty, notes, userId }) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Deduct stock
            await connection.query(
                `UPDATE inventory_items SET stock = stock - ? WHERE id = ?`,
                [qty, item_id]
            );

            // Log item out
            await connection.query(
                `INSERT INTO inventory_logs (item_id, type, qty, notes) VALUES (?, 'Keluar', ?, ?)`,
                [item_id, qty, notes]
            );

            // Audit activity
            await connection.query(
                `INSERT INTO activity_logs (user_id, action, details) VALUES (?, 'INVENTORY_OUT', ?)`,
                [userId, `Pemakaian persediaan item ID ${item_id} sebanyak ${qty}`]
            );

            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
}

module.exports = InventoryModel;
