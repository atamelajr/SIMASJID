const express = require('express');
const router = express.Router();
const KeuanganController = require('../controllers/KeuanganController');
const { checkAuth, checkRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/', checkAuth, KeuanganController.index);
router.post('/create', checkAuth, checkRole('Admin', 'Operator'), upload.single('proof_file'), KeuanganController.create);
router.post('/update/:id', checkAuth, checkRole('Admin', 'Operator'), upload.single('proof_file'), KeuanganController.update);
router.post('/delete/:id', checkAuth, checkRole('Admin'), KeuanganController.delete);

module.exports = router;
