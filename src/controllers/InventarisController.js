const AssetModel = require('../models/AssetModel');
const InventoryModel = require('../models/InventoryModel');
const MasterModel = require('../models/MasterModel');

class InventarisController {
    static async index(req, res) {
        try {
            const {
                tab = 'aset',
                // Aset filters
                asset_search = '',
                asset_category = '',
                asset_condition = '',
                asset_location = '',
                asset_page = 1,
                asset_limit = '10',
                // Inventory filters
                inv_search = '',
                inv_category = '',
                inv_page = 1,
                inv_limit = '10',
                // Log filters
                log_search = '',
                log_start_date = '',
                log_end_date = '',
                log_type = '',
                log_page = 1,
                log_limit = '10'
            } = req.query;

            const assetData = await AssetModel.getPaginatedAssets({
                search: asset_search,
                category: asset_category,
                condition: asset_condition,
                location: asset_location
            }, asset_page, asset_limit);

            const inventoryData = await InventoryModel.getPaginatedItems({
                search: inv_search,
                category: inv_category
            }, inv_page, inv_limit);

            const logData = await InventoryModel.getPaginatedLogs({
                search: log_search,
                type: log_type,
                start_date: log_start_date,
                end_date: log_end_date
            }, log_page, log_limit);

            const masterItems = await MasterModel.getAllMasterItems();
            const locations = await MasterModel.getAllLocations();
            const assetCatalog = masterItems.filter(item => item.type === 'Aset');
            const assetCategories = await MasterModel.getItemCategoriesByType('Aset');
            const inventoryCategories = await MasterModel.getItemCategoriesByType('Material');

            res.render('inventaris/index', {
                title: 'Manajemen Aset & Inventaris',
                activeTab: tab,
                // Aset Tetap data
                assets: assetData.assets,
                assetPagination: assetData.pagination,
                assetFilters: {
                    search: asset_search,
                    category: asset_category,
                    condition: asset_condition,
                    location: asset_location
                },
                // Persediaan data
                items: inventoryData.items,
                inventoryPagination: inventoryData.pagination,
                inventoryFilters: {
                    search: inv_search,
                    category: inv_category
                },
                // Logs data
                logs: logData.logs,
                logPagination: logData.pagination,
                logFilters: {
                    search: log_search,
                    start_date: log_start_date,
                    end_date: log_end_date,
                    type: log_type
                },
                // Parameters & dropdowns
                assetCatalog,
                assetCategories,
                inventoryCategories,
                masterItems,
                locations
            });
        } catch (err) {
            console.error('Inventaris Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async recordUsage(req, res) {
        try {
            const { item_id, qty, notes } = req.body;
            const userId = req.session.user.id;

            await InventoryModel.recordUsage({
                item_id: parseInt(item_id),
                qty: parseFloat(qty),
                notes,
                userId
            });

            res.redirect('/inventaris');
        } catch (err) {
            console.error('Record Usage Error:', err);
            res.redirect('/inventaris');
        }
    }

    static async createAsset(req, res) {
        try {
            const { name, brand, model_no_plate, source_origin, purchase_date, cost, condition_status, location, description, qty } = req.body;
            await AssetModel.createAsset({
                name,
                brand,
                model_no_plate,
                source_origin,
                purchase_date,
                cost: parseFloat(cost || 0),
                condition_status,
                location,
                description,
                qty: parseInt(qty) || 1
            });
            res.redirect('/inventaris');
        } catch (err) {
            console.error('Create Asset Error:', err);
            res.redirect('/inventaris');
        }
    }

    static async updateCondition(req, res) {
        try {
            const { id } = req.params;
            const { condition_status } = req.body;
            await AssetModel.updateCondition(id, condition_status);
            res.redirect('/inventaris');
        } catch (err) {
            console.error('Update Condition Error:', err);
            res.redirect('/inventaris');
        }
    }

    static async updateAssetDetail(req, res) {
        try {
            const { id } = req.params;
            const { name, brand, model_no_plate, source_origin, purchase_date, cost, condition_status, location, description } = req.body;
            await AssetModel.updateAssetDetail(id, {
                name,
                brand,
                model_no_plate,
                source_origin,
                purchase_date,
                cost: parseFloat(cost || 0),
                condition_status,
                location,
                description
            });
            res.redirect('/inventaris');
        } catch (err) {
            console.error('Update Asset Detail Error:', err);
            res.redirect('/inventaris');
        }
    }

    static async deleteAsset(req, res) {
        try {
            const { id } = req.params;
            await AssetModel.deleteAsset(id);
            res.redirect('/inventaris');
        } catch (err) {
            console.error('Delete Asset Error:', err);
            res.redirect('/inventaris');
        }
    }
}

module.exports = InventarisController;
