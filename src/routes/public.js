const express = require('express');
const router = express.Router();
const PublicController = require('../controllers/PublicController');

router.get('/', PublicController.getHome);
router.get('/jadwal-sholat', PublicController.getJadwalSholat);
router.get('/transparansi', PublicController.getTransparansi);
router.get('/proyek-donasi', PublicController.getProyekDonasi);
router.get('/display-tv', PublicController.getDisplayTV);

module.exports = router;
