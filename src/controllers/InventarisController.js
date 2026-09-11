const AssetModel = require('../models/AssetModel');
const InventoryModel = require('../models/InventoryModel');
const MasterModel = require('../models/MasterModel');

class InventarisController {
    static async index(req, res) {
        try {
            const assets = await AssetModel.getAllAssets();
            const items = await InventoryModel.getAllItems();
            const logs = await InventoryModel.getLogs();
            const masterItems = await MasterModel.getAllMasterItems();
            const locations = await MasterModel.getAllLocations();
            const assetCatalog = masterItems.filter(item => item.type === 'Aset');
            const assetCategories = await MasterModel.getItemCategoriesByType('Aset');

            res.render('inventaris/index', {
                title: 'Manajemen Aset & Inventaris',
                assets,
                items,
                logs,
                assetCatalog,
                assetCategories,
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
