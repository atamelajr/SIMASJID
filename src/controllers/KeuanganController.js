const TransactionModel = require('../models/TransactionModel');
const MasterModel = require('../models/MasterModel');

class KeuanganController {
    static async index(req, res) {
        try {
            const { account_id, type, payment_mode, start_date, end_date, page, limit } = req.query;
            
            const currentPage = parseInt(page) || 1;
            const currentLimit = limit || '10';

            const filters = {
                account_id: account_id || '',
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
                filters,
                selectedAccount: filters.account_id,
                selectedType: filters.type
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

            const data = {
                ...req.body,
                proof_file: proofFile,
                asset_item: req.body.asset_name ? {
                    name: req.body.asset_name,
                    condition: req.body.asset_condition,
                    location: req.body.asset_location
                } : null,
                inventory_item: req.body.inventory_name ? {
                    name: req.body.inventory_name,
                    unit: req.body.inventory_unit,
                    category: req.body.inventory_category,
                    qty: parseFloat(req.body.inventory_qty || 1)
                } : null
            };

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

            const isInKind = req.body.payment_mode === 'Donasi Barang' || req.body.is_in_kind == '1';
            const itemKindType = req.body.item_kind_type || 'Asset';

            const data = {
                ...req.body,
                proof_file: proofFile,
                asset_item: (isInKind && itemKindType === 'Asset' && req.body.asset_name) ? {
                    name: req.body.asset_name,
                    condition: req.body.asset_condition,
                    location: req.body.asset_location
                } : null,
                inventory_item: (isInKind && itemKindType === 'Material' && req.body.inventory_name) ? {
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
}

module.exports = KeuanganController;
