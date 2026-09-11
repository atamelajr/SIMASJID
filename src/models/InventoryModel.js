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

    static async getPaginatedItems(filters = {}, page = 1, limit = '10') {
        let whereSql = ` WHERE 1=1`;
        const params = [];

        if (filters.search) {
            whereSql += ` AND (ii.name LIKE ? OR ii.item_code LIKE ? OR mi.code LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.category) {
            whereSql += ` AND ii.category = ?`;
            params.push(filters.category);
        }

        const countSql = `
            SELECT COUNT(*) as total
            FROM inventory_items ii
            LEFT JOIN master_items mi ON ii.name = mi.name
            ${whereSql}
        `;
        const [countRows] = await db.query(countSql, params);
        const totalCount = countRows[0]?.total || 0;

        let sql = `
            SELECT ii.*, COALESCE(mi.code, ii.item_code) as item_code 
            FROM inventory_items ii
            LEFT JOIN master_items mi ON ii.name = mi.name
            ${whereSql}
            ORDER BY ii.category ASC, ii.name ASC
        `;

        let pageNum = parseInt(page) || 1;
        let limitStr = (limit || '10').toString();
        let limitNum = limitStr === 'all' ? (totalCount || 1) : (parseInt(limitStr) || 10);
        if (limitNum <= 0) limitNum = 10;
        
        let totalPages = limitStr === 'all' ? 1 : Math.ceil(totalCount / limitNum);
        if (totalPages === 0) totalPages = 1;

        if (limitStr !== 'all') {
            const offset = (pageNum - 1) * limitNum;
            sql += ` LIMIT ? OFFSET ?`;
            params.push(limitNum, offset);
        }

        const [items] = await db.query(sql, params);

        return {
            items,
            pagination: {
                totalCount,
                page: pageNum,
                limit: limitStr,
                totalPages
            }
        };
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

    static async getPaginatedLogs(filters = {}, page = 1, limit = '10') {
        let whereSql = ` WHERE 1=1`;
        const params = [];

        if (filters.search) {
            whereSql += ` AND (i.name LIKE ? OR l.notes LIKE ?)`;
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.type) {
            whereSql += ` AND l.type = ?`;
            params.push(filters.type);
        }
        if (filters.start_date) {
            whereSql += ` AND DATE(l.created_at) >= ?`;
            params.push(filters.start_date);
        }
        if (filters.end_date) {
            whereSql += ` AND DATE(l.created_at) <= ?`;
            params.push(filters.end_date);
        }

        const countSql = `
            SELECT COUNT(*) as total
            FROM inventory_logs l
            JOIN inventory_items i ON l.item_id = i.id
            ${whereSql}
        `;
        const [countRows] = await db.query(countSql, params);
        const totalCount = countRows[0]?.total || 0;

        let sql = `
            SELECT l.*, i.name as item_name, i.unit, i.category
            FROM inventory_logs l
            JOIN inventory_items i ON l.item_id = i.id
            ${whereSql}
            ORDER BY l.created_at DESC, l.id DESC
        `;

        let pageNum = parseInt(page) || 1;
        let limitStr = (limit || '10').toString();
        let limitNum = limitStr === 'all' ? (totalCount || 1) : (parseInt(limitStr) || 10);
        if (limitNum <= 0) limitNum = 10;
        
        let totalPages = limitStr === 'all' ? 1 : Math.ceil(totalCount / limitNum);
        if (totalPages === 0) totalPages = 1;

        if (limitStr !== 'all') {
            const offset = (pageNum - 1) * limitNum;
            sql += ` LIMIT ? OFFSET ?`;
            params.push(limitNum, offset);
        }

        const [logs] = await db.query(sql, params);

        return {
            logs,
            pagination: {
                totalCount,
                page: pageNum,
                limit: limitStr,
                totalPages
            }
        };
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
