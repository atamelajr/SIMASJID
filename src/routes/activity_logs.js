const express = require('express');
const router = express.Router();
const ActivityLogController = require('../controllers/ActivityLogController');
const { checkAuth, checkRole } = require('../middlewares/auth');

router.get('/', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), ActivityLogController.index);
router.get('/detail/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengurus'), ActivityLogController.getDetail);

module.exports = router;
