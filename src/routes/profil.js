const express = require('express');
const router = express.Router();
const ProfilController = require('../controllers/ProfilController');
const { checkAuth, checkRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/', checkAuth, ProfilController.index);
router.post('/update', checkAuth, checkRole('Admin'), ProfilController.updateProfile);
router.post('/dkm/add', checkAuth, checkRole('Admin'), upload.single('photo'), ProfilController.addDkmMember);

module.exports = router;
