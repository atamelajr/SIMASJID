const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const WebSettingController = require('../controllers/WebSettingController');
const { checkAuth, checkRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// User Settings Routes
router.get('/', checkAuth, checkRole('Admin'), SettingsController.index);
router.post('/users/create', checkAuth, checkRole('Admin'), SettingsController.createUser);
router.post('/users/update/:id', checkAuth, checkRole('Admin'), SettingsController.updateUser);
router.post('/users/toggle-status/:id', checkAuth, checkRole('Admin'), SettingsController.toggleUserStatus);

// Pengaturan Web (CMS Sub-Menu Routes)
// 1. Umum & Logo
router.get('/web/general', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.getGeneral);
router.post('/web/general', checkAuth, checkRole('Admin', 'Operator'), upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]), WebSettingController.updateGeneral);

// 2. Banner / Hero Slide
router.get('/web/banners', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.getBanners);
router.post('/web/banners/create', checkAuth, checkRole('Admin', 'Operator'), upload.single('image'), WebSettingController.createBanner);
router.post('/web/banners/update/:id', checkAuth, checkRole('Admin', 'Operator'), upload.single('image'), WebSettingController.updateBanner);
router.post('/web/banners/delete/:id', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.deleteBanner);

// 3. Pengumuman
router.get('/web/announcements', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.getAnnouncements);
router.post('/web/announcements/create', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.createAnnouncement);
router.post('/web/announcements/update/:id', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.updateAnnouncement);
router.post('/web/announcements/delete/:id', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.deleteAnnouncement);

// 4. Berita & Artikel
router.get('/web/articles', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.getArticles);
router.post('/web/articles/create', checkAuth, checkRole('Admin', 'Operator'), upload.single('thumbnail'), WebSettingController.createArticle);
router.post('/web/articles/update/:id', checkAuth, checkRole('Admin', 'Operator'), upload.single('thumbnail'), WebSettingController.updateArticle);
router.post('/web/articles/delete/:id', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.deleteArticle);

// 5. Galeri Foto
router.get('/web/galleries', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.getGalleries);
router.post('/web/galleries/create', checkAuth, checkRole('Admin', 'Operator'), upload.single('image'), WebSettingController.createGallery);
router.post('/web/galleries/delete/:id', checkAuth, checkRole('Admin', 'Operator'), WebSettingController.deleteGallery);

module.exports = router;
