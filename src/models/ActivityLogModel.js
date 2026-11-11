const db = require('../../config/database');

class ActivityLogModel {
    /**
     * Ambil data log aktivitas dengan pagination dan berbagai filter
     * @param {Object} filters - { search, action, user_id, start_date, end_date }
     * @param {number|string} page - Nomor halaman saat ini
     * @param {number|string} limit - Jumlah data per halaman (10, 25, 50, 100, atau 'all')
     */
    static async getPaginatedLogs(filters = {}, page = 1, limit = 20) {
        let whereSql = ' WHERE 1=1';
        const params = [];

        if (filters.search && filters.search.trim() !== '') {
            const pattern = `%${filters.search.trim()}%`;
            whereSql += ' AND (a.details LIKE ? OR u.username LIKE ? OR u.full_name LIKE ? OR a.action LIKE ?)';
            params.push(pattern, pattern, pattern, pattern);
        }

        if (filters.user_id && filters.user_id.trim() !== '') {
            whereSql += ' AND a.user_id = ?';
            params.push(filters.user_id.trim());
        }

        if (filters.action && filters.action.trim() !== '') {
            whereSql += ' AND a.action = ?';
            params.push(filters.action.trim());
        }

        if (filters.start_date && filters.start_date.trim() !== '') {
            whereSql += ' AND DATE(a.created_at) >= ?';
            params.push(filters.start_date.trim());
        }

        if (filters.end_date && filters.end_date.trim() !== '') {
            whereSql += ' AND DATE(a.created_at) <= ?';
            params.push(filters.end_date.trim());
        }

        // Hitung total data log yang cocok
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
             FROM activity_logs a 
             LEFT JOIN users u ON a.user_id = u.id 
             ${whereSql}`,
            params
        );
        const total = countResult[0]?.total || 0;

        let limitNum = limit === 'all' ? total : parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1) limitNum = 20;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) || 1 : 1;
        const offset = (pageNum - 1) * limitNum;

        let querySql = `
            SELECT a.*, u.username, u.full_name as user_name, r.name as role_name 
            FROM activity_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            LEFT JOIN roles r ON u.role_id = r.id 
            ${whereSql} 
            ORDER BY a.created_at DESC, a.id DESC
        `;

        const queryParams = [...params];
        if (limit !== 'all') {
            querySql += ' LIMIT ? OFFSET ?';
            queryParams.push(limitNum, offset);
        }

        const [logs] = await db.query(querySql, queryParams);

        return {
            logs,
            pagination: {
                page: pageNum,
                limit: limit.toString(),
                total,
                totalPages
            }
        };
    }

    /**
     * Ambil daftar jenis aksi unik dari activity_logs
     */
    static async getAvailableActions() {
        try {
            const [rows] = await db.query(
                `SELECT DISTINCT action FROM activity_logs WHERE action IS NOT NULL AND action != '' ORDER BY action ASC`
            );
            return rows.map(r => r.action);
        } catch (err) {
            console.error('Error fetching actions:', err);
            return ['TRANSACTION_CREATE', 'TRANSACTION_UPDATE', 'TRANSACTION_DELETE', 'DEBT_PAYMENT', 'INVENTORY_OUT'];
        }
    }

    /**
     * Ambil daftar pengguna yang memiliki aktivitas
     */
    static async getLogUsers() {
        try {
            const [rows] = await db.query(
                `SELECT DISTINCT u.id, u.username, u.full_name, r.name as role_name 
                 FROM activity_logs a 
                 JOIN users u ON a.user_id = u.id 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 ORDER BY u.username ASC`
            );
            return rows;
        } catch (err) {
            console.error('Error fetching log users:', err);
            return [];
        }
    }

    /**
     * Ambil detail satu log berdasarkan ID
     */
    static async getLogById(id) {
        const [rows] = await db.query(
            `SELECT a.*, u.username, u.full_name as user_name, r.name as role_name 
             FROM activity_logs a 
             LEFT JOIN users u ON a.user_id = u.id 
             LEFT JOIN roles r ON u.role_id = r.id 
             WHERE a.id = ?`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = ActivityLogModel;
