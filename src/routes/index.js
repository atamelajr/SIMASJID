const express = require('express');
const router = express.Router();

const publicRoutes = require('./public');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const keuanganRoutes = require('./keuangan');
const inventarisRoutes = require('./inventaris');
const proyekRoutes = require('./proyek');
const profilRoutes = require('./profil');
const laporanRoutes = require('./laporan');
const settingsRoutes = require('./settings');
const masterRoutes = require('./master');

// Back Office Routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/keuangan', keuanganRoutes);
router.use('/inventaris', inventarisRoutes);
router.use('/proyek', proyekRoutes);
router.use('/profil', profilRoutes);
router.use('/laporan', laporanRoutes);
router.use('/settings', settingsRoutes);
router.use('/master', masterRoutes);

// Public Portal Routes (Beranda, Jadwal Sholat, Transparansi, Proyek Donasi, TV Masjid)
router.use('/', publicRoutes);

module.exports = router;
