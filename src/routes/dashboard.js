const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { checkAuth } = require('../middlewares/auth');

router.get('/', checkAuth, DashboardController.index);

module.exports = router;
