const express = require('express');
const router = express.Router();
const InventarisController = require('../controllers/InventarisController');
const { checkAuth, checkRole } = require('../middlewares/auth');

router.get('/', checkAuth, InventarisController.index);
router.post('/usage', checkAuth, checkRole('Admin', 'Operator'), InventarisController.recordUsage);

router.post('/asset/create', checkAuth, checkRole('Admin', 'Operator'), InventarisController.createAsset);
router.post('/asset/update-condition/:id', checkAuth, checkRole('Admin', 'Operator'), InventarisController.updateCondition);
router.post('/asset/update/:id', checkAuth, checkRole('Admin', 'Operator'), InventarisController.updateAssetDetail);
router.post('/asset/delete/:id', checkAuth, checkRole('Admin'), InventarisController.deleteAsset);

module.exports = router;
