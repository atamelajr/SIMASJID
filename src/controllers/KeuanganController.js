const TransactionModel = require('../models/TransactionModel');
const MasterModel = require('../models/MasterModel');
const MasjidModel = require('../models/MasjidModel');
const ExcelExportService = require('../services/ExcelExportService');

class KeuanganController {
    static async index(req, res) {
        try {
            const { account_id, category_id, type, payment_mode, start_date, end_date, page, limit } = req.query;
            
            const currentPage = parseInt(page) || 1;
            const currentLimit = limit || '10';

            const filters = {
                account_id: account_id || '',
                category_id: category_id || '',
                type: type || '',
                payment_mode: payment_mode || '',
                start_date: start_date || '',
                end_date: end_date || ''
            };

            const result = await TransactionModel.getPaginatedTransactions(filters, currentPage, currentLimit);
            const accounts = await TransactionModel.getAccounts();
            const categories = await TransactionModel.getCategories();
            const masterItems = await MasterModel.getAllMasterItems();
            const units = await MasterModel.getAllUnits();
            const locations = await MasterModel.getAllLocations();
            const donors = await MasterModel.getDonorsMustahik('Donatur');

            const exportParams = new URLSearchParams();
            if (filters.start_date) exportParams.set('start_date', filters.start_date);
            if (filters.end_date) exportParams.set('end_date', filters.end_date);
            if (filters.type) exportParams.set('type', filters.type);
            if (filters.category_id) exportParams.set('category_id', filters.category_id);
            if (filters.payment_mode) exportParams.set('payment_mode', filters.payment_mode);
            if (filters.account_id) exportParams.set('account_id', filters.account_id);
            const exportQuery = exportParams.toString() ? `?${exportParams.toString()}` : '';

            res.render('keuangan/index', {
                title: 'Transaksi Keuangan',
                transactions: result.transactions,
                pagination: {
                    totalCount: result.totalCount,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages
                },
                accounts,
                categories,
                masterItems,
                units,
                locations,
                donors,
                filters,
                selectedAccount: filters.account_id,
                selectedType: filters.type,
                exportQuery
            });
        } catch (err) {
            console.error('Keuangan Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async create(req, res) {
        try {
            const userId = req.session.user.id;
            const proofFile = req.file ? req.file.filename : null;

            const isHutang = req.body.payment_mode === 'Hutang';
            const isInKind = req.body.payment_mode === 'Donasi Barang' || req.body.is_in_kind == '1';
            const itemKindType = req.body.item_kind_type || 'Asset';

            const data = {
                ...req.body,
                proof_file: proofFile,
                asset_item: req.body.asset_name ? {
                    name: req.body.asset_name,
                    condition: req.body.asset_condition,
                    location: req.body.asset_location,
                    qty: parseInt(req.body.asset_qty) || 1,
                    source_origin: (req.body.payment_mode === 'Donasi Barang' || req.body.type === 'Penerimaan') ? 'Hibah' : 'Pembelian'
                } : null,
                inventory_item: ((isInKind || isHutang || itemKindType === 'Material') && req.body.inventory_name) ? {
                    name: req.body.inventory_name,
                    unit: req.body.inventory_unit,
                    category: req.body.inventory_category,
                    qty: parseFloat(req.body.inventory_qty || 1)
                } : null
            };

            if (req.body.type === 'Mutasi' && req.body.account_id == req.body.target_account_id) {
                console.error('Create Mutation Error: Rekening Asal dan Rekening Tujuan tidak boleh sama.');
                return res.redirect('/keuangan');
            }

            await TransactionModel.createTransaction(data, userId);
            res.redirect('/keuangan');
        } catch (err) {
            console.error('Create Transaction Error:', err);
            res.redirect('/keuangan');
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;
            const proofFile = req.file ? req.file.filename : null;

            const isHutang = req.body.payment_mode === 'Hutang';
            const isInKind = req.body.payment_mode === 'Donasi Barang' || req.body.is_in_kind == '1';
            const itemKindType = req.body.item_kind_type || 'Asset';

            const data = {
                ...req.body,
                proof_file: proofFile,
                asset_item: req.body.asset_name ? {
                    name: req.body.asset_name,
                    condition: req.body.asset_condition,
                    location: req.body.asset_location,
                    qty: parseInt(req.body.asset_qty) || 1,
                    source_origin: (req.body.payment_mode === 'Donasi Barang' || req.body.type === 'Penerimaan') ? 'Hibah' : 'Pembelian'
                } : null,
                inventory_item: ((isInKind || isHutang || itemKindType === 'Material') && req.body.inventory_name) ? {
                    name: req.body.inventory_name,
                    unit: req.body.inventory_unit,
                    category: req.body.inventory_category,
                    qty: parseFloat(req.body.inventory_qty || 1)
                } : null
            };

            await TransactionModel.updateTransaction(id, data, userId);
            res.redirect('/keuangan');
        } catch (err) {
            console.error('Update Transaction Error:', err);
            res.redirect('/keuangan');
        }
    }

    static async payDebt(req, res) {
        try {
            const { id } = req.params;
            const { paid_account_id, payment_date } = req.body;
            const userId = req.session.user.id;

            await TransactionModel.payDebt(id, paid_account_id, payment_date, userId);
            res.redirect('/keuangan');
        } catch (err) {
            console.error('Pay Debt Error:', err);
            res.redirect('/keuangan');
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.session.user.id;

            await TransactionModel.deleteTransaction(id, userId);
            res.redirect('/keuangan');
        } catch (err) {
            console.error('Delete Transaction Error:', err);
            res.redirect('/keuangan');
        }
    }

    static async exportExcel(req, res) {
        try {
            const { account_id, category_id, type, payment_mode, start_date, end_date } = req.query;

            const filters = {
                account_id: account_id || '',
                category_id: category_id || '',
                type: type || '',
                payment_mode: payment_mode || '',
                start_date: start_date || '',
                end_date: end_date || ''
            };

            const transactions = await TransactionModel.getAllTransactions(filters);
            const accounts = await TransactionModel.getAccounts();
            const categories = await TransactionModel.getCategories();
            const masjidProfile = await MasjidModel.getProfile();

            // Label lookup for friendly header descriptions
            let accountName = 'Semua Rekening Kas & Bank';
            if (filters.account_id) {
                const acc = accounts.find(a => String(a.id) === String(filters.account_id));
                if (acc) accountName = `${acc.code} - ${acc.name}`;
            }

            let categoryName = 'Semua Kategori (COA)';
            if (filters.category_id) {
                const cat = categories.find(c => String(c.id) === String(filters.category_id));
                if (cat) categoryName = `${cat.account_code} - ${cat.name}`;
            }

            let periodLabel = 'Semua Periode Transaksi';
            if (filters.start_date && filters.end_date) {
                periodLabel = `${filters.start_date} s/d ${filters.end_date}`;
            } else if (filters.start_date) {
                periodLabel = `Mulai dari ${filters.start_date}`;
            } else if (filters.end_date) {
                periodLabel = `Sampai dengan ${filters.end_date}`;
            }

            const filterLabels = {
                periodLabel,
                typeName: filters.type || 'Semua Tipe',
                categoryName,
                paymentModeName: filters.payment_mode || 'Semua Bentuk',
                accountName,
                exportDate: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
            };

            const workbook = await ExcelExportService.generateTransactionsExcel({
                transactions,
                filters,
                filterLabels,
                masjidProfile,
                user: req.session.user
            });

            const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
            const filename = `Transaksi_Keuangan_SIMASJID_${timestamp}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (err) {
            console.error('Export Excel Error:', err);
            res.redirect('/keuangan');
        }
    }
}

module.exports = KeuanganController;
