const express = require('express');
const router = express.Router();
const LaporanController = require('../controllers/LaporanController');
const { checkAuth } = require('../middlewares/auth');

router.get('/', checkAuth, LaporanController.index);
router.get('/posisi-keuangan', checkAuth, LaporanController.posisiKeuangan);
router.get('/aktivitas', checkAuth, LaporanController.aktivitas);
router.get('/kas', checkAuth, LaporanController.kas);
router.get('/mutasi-kas', checkAuth, LaporanController.mutasiKas);
router.get('/inventaris', checkAuth, LaporanController.inventaris);
router.get('/persediaan', checkAuth, LaporanController.persediaan);

module.exports = router;
