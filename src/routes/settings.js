const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const { checkAuth, checkRole } = require('../middlewares/auth');

router.get('/', checkAuth, checkRole('Admin'), SettingsController.index);
router.post('/users/create', checkAuth, checkRole('Admin'), SettingsController.createUser);

module.exports = router;
