const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const { checkAuth, checkRole } = require('../middlewares/auth');

router.get('/', checkAuth, checkRole('Admin'), SettingsController.index);
router.post('/users/create', checkAuth, checkRole('Admin'), SettingsController.createUser);
router.post('/users/update/:id', checkAuth, checkRole('Admin'), SettingsController.updateUser);
router.post('/users/toggle-status/:id', checkAuth, checkRole('Admin'), SettingsController.toggleUserStatus);

module.exports = router;
