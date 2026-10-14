const express = require('express');
const router = express.Router();
const LaporanController = require('../controllers/LaporanController');
const { checkAuth, checkRole } = require('../middlewares/auth');

router.get('/', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), LaporanController.index);
router.get('/posisi-keuangan', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), LaporanController.posisiKeuangan);
router.get('/aktivitas', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), LaporanController.aktivitas);
router.get('/kas', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), LaporanController.kas);
router.get('/mutasi-kas', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), LaporanController.mutasiKas);
router.get('/inventaris', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), LaporanController.inventaris);
router.get('/persediaan', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), LaporanController.persediaan);

module.exports = router;
