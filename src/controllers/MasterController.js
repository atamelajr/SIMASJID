const MasterModel = require('../models/MasterModel');

class MasterController {
    // 1. Categories & COA
    static async categoriesIndex(req, res) {
        try {
            const categories = await MasterModel.getAllCategories();
            const nextCategoryCodes = await MasterModel.getNextCategoryCodes();
            res.render('master/categories', {
                title: 'Master Parameter - Kategori & Bagan Akun (COA)',
                activeSubmenu: 'categories',
                categories,
                nextCategoryCodes
            });
        } catch (err) {
            console.error('Master Categories Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async createCategory(req, res) {
        try {
            await MasterModel.createCategory(req.body);
            res.redirect('/master/categories');
        } catch (err) {
            console.error('Create Category Error:', err);
            res.redirect('/master/categories');
        }
    }

    static async updateCategory(req, res) {
        try {
            await MasterModel.updateCategory(req.params.id, req.body);
            res.redirect('/master/categories');
        } catch (err) {
            console.error('Update Category Error:', err);
            res.redirect('/master/categories');
        }
    }

    static async deleteCategory(req, res) {
        try {
            await MasterModel.deleteCategory(req.params.id);
            res.redirect('/master/categories');
        } catch (err) {
            console.error('Delete Category Error:', err);
            res.redirect('/master/categories');
        }
    }

    // 2. Rekening Kas & Bank
    static async accountsIndex(req, res) {
        try {
            const accounts = await MasterModel.getAllAccounts();
            res.render('master/accounts', {
                title: 'Master Parameter - Rekening Kas & Bank',
                activeSubmenu: 'accounts',
                accounts
            });
        } catch (err) {
            console.error('Master Accounts Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async createAccount(req, res) {
        try {
            await MasterModel.createAccount(req.body);
            res.redirect('/master/accounts');
        } catch (err) {
            console.error('Create Account Error:', err);
            res.redirect('/master/accounts');
        }
    }

    static async updateAccount(req, res) {
        try {
            await MasterModel.updateAccount(req.params.id, req.body);
            res.redirect('/master/accounts');
        } catch (err) {
            console.error('Update Account Error:', err);
            res.redirect('/master/accounts');
        }
    }

    static async deleteAccount(req, res) {
        try {
            await MasterModel.deleteAccount(req.params.id);
            res.redirect('/master/accounts');
        } catch (err) {
            console.error('Delete Account Error:', err);
            res.redirect('/master/accounts');
        }
    }

    // 3. Satuan Barang
    static async unitsIndex(req, res) {
        try {
            const units = await MasterModel.getAllUnits();
            res.render('master/units', {
                title: 'Master Parameter - Satuan Barang',
                activeSubmenu: 'units',
                units
            });
        } catch (err) {
            console.error('Master Units Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async createUnit(req, res) {
        try {
            await MasterModel.createUnit(req.body);
            res.redirect('/master/units');
        } catch (err) {
            console.error('Create Unit Error:', err);
            res.redirect('/master/units');
        }
    }

    static async updateUnit(req, res) {
        try {
            await MasterModel.updateUnit(req.params.id, req.body);
            res.redirect('/master/units');
        } catch (err) {
            console.error('Update Unit Error:', err);
            res.redirect('/master/units');
        }
    }

    static async deleteUnit(req, res) {
        try {
            await MasterModel.deleteUnit(req.params.id);
            res.redirect('/master/units');
        } catch (err) {
            console.error('Delete Unit Error:', err);
            res.redirect('/master/units');
        }
    }

    // 4. Katalog Barang & Material
    static async masterItemsIndex(req, res) {
        try {
            const items = await MasterModel.getAllMasterItems();
            const units = await MasterModel.getAllUnits();
            const itemCategories = await MasterModel.getAllItemCategories();
            const nextCodes = await MasterModel.getNextItemCodes();
            res.render('master/items', {
                title: 'Master Parameter - Katalog Barang & Material',
                activeSubmenu: 'items',
                items,
                units,
                itemCategories,
                nextCodes
            });
        } catch (err) {
            console.error('Master Items Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async createMasterItem(req, res) {
        try {
            await MasterModel.createMasterItem(req.body);
            res.redirect('/master/items');
        } catch (err) {
            console.error('Create Master Item Error:', err);
            res.redirect('/master/items');
        }
    }

    static async updateMasterItem(req, res) {
        try {
            await MasterModel.updateMasterItem(req.params.id, req.body);
            res.redirect('/master/items');
        } catch (err) {
            console.error('Update Master Item Error:', err);
            res.redirect('/master/items');
        }
    }

    static async deleteMasterItem(req, res) {
        try {
            await MasterModel.deleteMasterItem(req.params.id);
            res.redirect('/master/items');
        } catch (err) {
            console.error('Delete Master Item Error:', err);
            res.redirect('/master/items');
        }
    }

    // 5. Donatur & Mustahik
    static async donorsMustahikIndex(req, res) {
        try {
            const donors = await MasterModel.getDonorsMustahik('Donatur');
            const mustahik = await MasterModel.getDonorsMustahik('Mustahik');
            res.render('master/donors_mustahik', {
                title: 'Master Parameter - Donatur & Mustahik',
                activeSubmenu: 'donors-mustahik',
                donors,
                mustahik
            });
        } catch (err) {
            console.error('Master Donors/Mustahik Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async createDonorMustahik(req, res) {
        try {
            await MasterModel.createDonorMustahik(req.body);
            res.redirect('/master/donors-mustahik');
        } catch (err) {
            console.error('Create Donor/Mustahik Error:', err);
            res.redirect('/master/donors-mustahik');
        }
    }

    static async updateDonorMustahik(req, res) {
        try {
            await MasterModel.updateDonorMustahik(req.params.id, req.body);
            res.redirect('/master/donors-mustahik');
        } catch (err) {
            console.error('Update Donor/Mustahik Error:', err);
            res.redirect('/master/donors-mustahik');
        }
    }

    static async deleteDonorMustahik(req, res) {
        try {
            await MasterModel.deleteDonorMustahik(req.params.id);
            res.redirect('/master/donors-mustahik');
        } catch (err) {
            console.error('Delete Donor/Mustahik Error:', err);
            res.redirect('/master/donors-mustahik');
        }
    }

    // 6. Kategori Barang & Aset (COA ISAK 35)
    static async itemCategoriesIndex(req, res) {
        try {
            const itemCategories = await MasterModel.getAllItemCategories();
            const nextCodes = await MasterModel.getNextItemCategoryCodes();
            res.render('master/item_categories', {
                title: 'Master Parameter - Kategori Barang & Aset (ISAK 35)',
                activeSubmenu: 'item-categories',
                itemCategories,
                nextCodes
            });
        } catch (err) {
            console.error('Master Item Categories Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async createItemCategory(req, res) {
        try {
            await MasterModel.createItemCategory(req.body);
            res.redirect('/master/item-categories');
        } catch (err) {
            console.error('Create Item Category Error:', err);
            res.redirect('/master/item-categories');
        }
    }

    static async updateItemCategory(req, res) {
        try {
            await MasterModel.updateItemCategory(req.params.id, req.body);
            res.redirect('/master/item-categories');
        } catch (err) {
            console.error('Update Item Category Error:', err);
            res.redirect('/master/item-categories');
        }
    }

    static async deleteItemCategory(req, res) {
        try {
            await MasterModel.deleteItemCategory(req.params.id);
            res.redirect('/master/item-categories');
        } catch (err) {
            console.error('Delete Item Category Error:', err);
            res.redirect('/master/item-categories');
        }
    }
}

module.exports = MasterController;
