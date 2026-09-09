const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const keuanganRoutes = require('./keuangan');
const inventarisRoutes = require('./inventaris');
const proyekRoutes = require('./proyek');
const profilRoutes = require('./profil');
const laporanRoutes = require('./laporan');
const settingsRoutes = require('./settings');
const masterRoutes = require('./master');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/keuangan', keuanganRoutes);
router.use('/inventaris', inventarisRoutes);
router.use('/proyek', proyekRoutes);
router.use('/profil', profilRoutes);
router.use('/laporan', laporanRoutes);
router.use('/settings', settingsRoutes);
router.use('/master', masterRoutes);

router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

module.exports = router;
