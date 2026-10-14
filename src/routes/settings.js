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
router.get('/web/general', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.getGeneral);
router.post('/web/general', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
]), WebSettingController.updateGeneral);

// 2. Pengaturan Menu Navigasi Web (FrontEnd)
router.get('/web/menus', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.getMenus);
router.post('/web/menus/create', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.createMenu);
router.post('/web/menus/update/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.updateMenu);
router.post('/web/menus/toggle/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.toggleMenuStatus);
router.post('/web/menus/delete/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.deleteMenu);

// 3. Banner / Slide Hero
router.get('/web/banners', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.getBanners);
router.post('/web/banners/carousel-settings', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.updateCarouselSettings);
router.post('/web/banners/create', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.single('image'), WebSettingController.createBanner);
router.post('/web/banners/update/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.single('image'), WebSettingController.updateBanner);
router.post('/web/banners/delete/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.deleteBanner);

// 4. Pengumuman
router.get('/web/announcements', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.getAnnouncements);
router.post('/web/announcements/create', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.createAnnouncement);
router.post('/web/announcements/update/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.updateAnnouncement);
router.post('/web/announcements/delete/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.deleteAnnouncement);

// 5. Berita & Artikel
router.get('/web/articles', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.getArticles);
router.post('/web/articles/upload-image', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 5MB.' : 'Gagal mengunggah gambar.';
            return res.status(400).json({ success: false, message });
        }
        next();
    });
}, WebSettingController.uploadArticleImage);
router.post('/web/articles/create', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.single('thumbnail'), WebSettingController.createArticle);
router.post('/web/articles/update/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.single('thumbnail'), WebSettingController.updateArticle);
router.post('/web/articles/delete/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.deleteArticle);

// 6. Galeri Foto & Album
router.get('/web/galleries', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.getGalleries);
router.post('/web/galleries/album/create', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.array('images', 30), WebSettingController.createAlbum);
router.post('/web/galleries/album/update/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.updateAlbum);
router.post('/web/galleries/album/delete/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.deleteAlbum);
router.post('/web/galleries/album/toggle-home/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.toggleAlbumHome);
router.get('/web/galleries/album/:id/photos', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.getAlbumPhotos);
router.post('/web/galleries/album/:id/add-photos', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.array('images', 30), WebSettingController.addPhotosToAlbum);
router.post('/web/galleries/album/:id/photos/add', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.array('images', 30), WebSettingController.addPhotosToAlbum);
router.post('/web/galleries/album/:id/delete-photo/:photoId', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.deleteAlbumPhoto);
router.post('/web/galleries/album/photo/delete/:photoId', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.deleteAlbumPhoto);
router.post('/web/galleries/album/:id/set-cover', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.setCoverPhoto);
router.post('/web/galleries/album/:id/cover/:photoId', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.setCoverPhoto);

// Fallbacks
router.post('/web/galleries/create', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.array('images', 30), WebSettingController.createAlbum);
router.post('/web/galleries/create-multiple', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.array('images', 30), WebSettingController.createAlbum);
router.post('/web/galleries/update/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), upload.single('image'), WebSettingController.updateGallery);
router.post('/web/galleries/delete/:id', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.deleteGallery);
router.post('/web/galleries/bulk-delete', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.bulkDeleteGalleries);

// 7. Pengaturan Jadwal Sholat & Petugas Jumat
router.get('/web/prayer', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.getPrayer);
router.post('/web/prayer', checkAuth, checkRole('Admin', 'Operator', 'Pengelola Web'), WebSettingController.updatePrayer);

module.exports = router;
