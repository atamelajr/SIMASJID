const ActivityLogModel = require('../models/ActivityLogModel');

class ActivityLogController {
    static async index(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = req.query.limit || '20';
            const filters = {
                search: req.query.search || '',
                action: req.query.action || '',
                user_id: req.query.user_id || '',
                start_date: req.query.start_date || '',
                end_date: req.query.end_date || ''
            };

            const [result, actions, logUsers] = await Promise.all([
                ActivityLogModel.getPaginatedLogs(filters, page, limit),
                ActivityLogModel.getAvailableActions(),
                ActivityLogModel.getLogUsers()
            ]);

            // Helper mapping badge action
            const getActionMeta = (action) => {
                switch (action) {
                    case 'TRANSACTION_CREATE':
                        return { label: 'Tambah Transaksi', badgeClass: 'bg-success-subtle text-success border-success-subtle', icon: 'bi-plus-circle' };
                    case 'TRANSACTION_UPDATE':
                        return { label: 'Ubah Transaksi', badgeClass: 'bg-warning-subtle text-warning-emphasis border-warning-subtle', icon: 'bi-pencil-square' };
                    case 'TRANSACTION_DELETE':
                        return { label: 'Hapus Transaksi', badgeClass: 'bg-danger-subtle text-danger border-danger-subtle', icon: 'bi-trash3' };
                    case 'DEBT_PAYMENT':
                        return { label: 'Pelunasan Utang', badgeClass: 'bg-primary-subtle text-primary border-primary-subtle', icon: 'bi-cash-coin' };
                    case 'INVENTORY_OUT':
                        return { label: 'Pemakaian Barang', badgeClass: 'bg-info-subtle text-info-emphasis border-info-subtle', icon: 'bi-box-arrow-right' };
                    default:
                        return { label: action || 'Aktivitas', badgeClass: 'bg-secondary-subtle text-secondary border-secondary-subtle', icon: 'bi-activity' };
                }
            };

            res.render('activity_logs/index', {
                title: 'Log Aktivitas Pengguna',
                logs: result.logs,
                pagination: result.pagination,
                filters,
                actions,
                logUsers,
                getActionMeta
            });
        } catch (err) {
            console.error('ActivityLogController index error:', err);
            req.flash('error_msg', 'Terjadi kesalahan saat memuat data log aktivitas.');
            res.redirect('/dashboard');
        }
    }

    static async getDetail(req, res) {
        try {
            const { id } = req.params;
            const log = await ActivityLogModel.getLogById(id);
            if (!log) {
                return res.status(404).json({ success: false, message: 'Data log tidak ditemukan' });
            }
            res.json({ success: true, log });
        } catch (err) {
            console.error('ActivityLogController getDetail error:', err);
            res.status(500).json({ success: false, message: 'Gagal memuat detail log' });
        }
    }
}

module.exports = ActivityLogController;
