const express = require('express');
const router = express.Router();
const MasterController = require('../controllers/MasterController');
const { checkAuth, checkRole } = require('../middlewares/auth');

// Categories & COA
router.get('/categories', checkAuth, checkRole('Admin', 'Operator'), MasterController.categoriesIndex);
router.post('/categories/create', checkAuth, checkRole('Admin', 'Operator'), MasterController.createCategory);
router.post('/categories/update/:id', checkAuth, checkRole('Admin', 'Operator'), MasterController.updateCategory);
router.post('/categories/delete/:id', checkAuth, checkRole('Admin'), MasterController.deleteCategory);

// Accounts & Bank
router.get('/accounts', checkAuth, checkRole('Admin', 'Operator'), MasterController.accountsIndex);
router.post('/accounts/create', checkAuth, checkRole('Admin', 'Operator'), MasterController.createAccount);
router.post('/accounts/update/:id', checkAuth, checkRole('Admin', 'Operator'), MasterController.updateAccount);
router.post('/accounts/delete/:id', checkAuth, checkRole('Admin'), MasterController.deleteAccount);

// Units
router.get('/units', checkAuth, checkRole('Admin', 'Operator'), MasterController.unitsIndex);
router.post('/units/create', checkAuth, checkRole('Admin', 'Operator'), MasterController.createUnit);
router.post('/units/update/:id', checkAuth, checkRole('Admin', 'Operator'), MasterController.updateUnit);
router.post('/units/delete/:id', checkAuth, checkRole('Admin'), MasterController.deleteUnit);

// Master Items (Katalog Barang & Material)
router.get('/items', checkAuth, checkRole('Admin', 'Operator'), MasterController.masterItemsIndex);
router.post('/items/create', checkAuth, checkRole('Admin', 'Operator'), MasterController.createMasterItem);
router.post('/items/update/:id', checkAuth, checkRole('Admin', 'Operator'), MasterController.updateMasterItem);
router.post('/items/delete/:id', checkAuth, checkRole('Admin'), MasterController.deleteMasterItem);

// Donors & Mustahik
router.get('/donors-mustahik', checkAuth, checkRole('Admin', 'Operator'), MasterController.donorsMustahikIndex);
router.post('/donors-mustahik/create', checkAuth, checkRole('Admin', 'Operator'), MasterController.createDonorMustahik);
router.post('/donors-mustahik/update/:id', checkAuth, checkRole('Admin', 'Operator'), MasterController.updateDonorMustahik);
router.post('/donors-mustahik/delete/:id', checkAuth, checkRole('Admin'), MasterController.deleteDonorMustahik);
// Item Categories & COA (Aset & Material)
router.get('/item-categories', checkAuth, checkRole('Admin', 'Operator'), MasterController.itemCategoriesIndex);
router.post('/item-categories/create', checkAuth, checkRole('Admin', 'Operator'), MasterController.createItemCategory);
router.post('/item-categories/update/:id', checkAuth, checkRole('Admin', 'Operator'), MasterController.updateItemCategory);
router.post('/item-categories/delete/:id', checkAuth, checkRole('Admin'), MasterController.deleteItemCategory);

// Locations (Lokasi Barang & Aset)
router.get('/locations', checkAuth, checkRole('Admin', 'Operator'), MasterController.locationsIndex);
router.post('/locations/create', checkAuth, checkRole('Admin', 'Operator'), MasterController.createLocation);
router.post('/locations/update/:id', checkAuth, checkRole('Admin', 'Operator'), MasterController.updateLocation);
router.post('/locations/delete/:id', checkAuth, checkRole('Admin'), MasterController.deleteLocation);

module.exports = router;
