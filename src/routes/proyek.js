const express = require('express');
const router = express.Router();
const ProyekController = require('../controllers/ProyekController');
const { checkAuth, checkRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/', checkAuth, ProyekController.index);
router.post('/create', checkAuth, checkRole('Admin', 'Operator'), ProyekController.createProject);
router.post('/update/:id', checkAuth, checkRole('Admin', 'Operator'), ProyekController.updateProject);
router.post('/delete/:id', checkAuth, checkRole('Admin'), ProyekController.deleteProject);

router.post('/progress', checkAuth, checkRole('Admin', 'Operator'), upload.single('photo'), ProyekController.addProgress);
router.post('/progress/update/:id', checkAuth, checkRole('Admin', 'Operator'), upload.single('photo'), ProyekController.updateProgress);
router.post('/progress/delete/:id', checkAuth, checkRole('Admin'), ProyekController.deleteProgress);

module.exports = router;
