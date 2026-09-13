const express = require('express');
const router = express.Router();
const PublicController = require('../controllers/PublicController');

router.get('/', PublicController.getHome);
router.get('/jadwal-sholat', PublicController.getJadwalSholat);
router.get('/transparansi', PublicController.getTransparansi);
router.get('/proyek-donasi', PublicController.getProyekDonasi);
router.get('/berita', PublicController.getBerita);
router.get('/berita/:slug', PublicController.getBeritaDetail);
router.get('/galeri', PublicController.getGaleri);
router.get('/pengumuman', PublicController.getPengumuman);
router.get('/display-tv', PublicController.getDisplayTV);

module.exports = router;
