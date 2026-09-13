const WebSettingModel = require('../models/WebSettingModel');

class WebSettingController {
    // 1. Umum & Logo (/settings/web/general)
    static async getGeneral(req, res) {
        try {
            const profile = await WebSettingModel.getWebProfile();
            res.render('settings/web_general', {
                title: 'Pengaturan Umum & Logo Web',
                activeSubmenu: 'web-general',
                profile,
                successMsg: req.query.success || null,
                errorMsg: req.query.error || null
            });
        } catch (error) {
            console.error('Error WebSettingController getGeneral:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    static async updateGeneral(req, res) {
        try {
            const {
                name, address, phone, email, vision, mission, history,
                social_facebook, social_instagram, social_youtube, social_whatsapp,
                hero_title, hero_subtitle, maps_embed, running_text
            } = req.body;

            const existing = await WebSettingModel.getWebProfile();
            let logoPath = existing.logo;
            let faviconPath = existing.favicon;

            if (req.files) {
                if (req.files.logo && req.files.logo[0]) {
                    logoPath = '/uploads/' + req.files.logo[0].filename;
                }
                if (req.files.favicon && req.files.favicon[0]) {
                    faviconPath = '/uploads/' + req.files.favicon[0].filename;
                }
            }

            await WebSettingModel.updateWebProfile({
                name, address, phone, email, vision, mission, history,
                logo: logoPath,
                favicon: faviconPath,
                social_facebook, social_instagram, social_youtube, social_whatsapp,
                hero_title, hero_subtitle, maps_embed, running_text
            });

            res.redirect('/settings/web/general?success=Pengaturan+umum+web+berhasil+disimpan');
        } catch (error) {
            console.error('Error WebSettingController updateGeneral:', error);
            res.redirect('/settings/web/general?error=Gagal+menyimpan+pengaturan+web');
        }
    }

    // 2. Banner / Slide Hero (/settings/web/banners)
    static async getBanners(req, res) {
        try {
            const banners = await WebSettingModel.getAllBanners();
            res.render('settings/web_banners', {
                title: 'Kelola Banner & Slide Hero',
                activeSubmenu: 'web-banners',
                banners,
                successMsg: req.query.success || null,
                errorMsg: req.query.error || null
            });
        } catch (error) {
            console.error('Error WebSettingController getBanners:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    static async createBanner(req, res) {
        try {
            const { title, subtitle, button_text, button_link, display_order, is_active } = req.body;
            let image_url = '/images/hero-default.jpg';
            if (req.file) {
                image_url = '/uploads/' + req.file.filename;
            }

            await WebSettingModel.createBanner({
                title, subtitle, image_url, button_text, button_link,
                display_order: parseInt(display_order || 0),
                is_active: is_active ? 1 : 0
            });

            res.redirect('/settings/web/banners?success=Banner+berhasil+ditambahkan');
        } catch (error) {
            console.error('Error WebSettingController createBanner:', error);
            res.redirect('/settings/web/banners?error=Gagal+menambahkan+banner');
        }
    }

    static async updateBanner(req, res) {
        try {
            const { id } = req.params;
            const { title, subtitle, button_text, button_link, display_order, is_active } = req.body;
            let image_url = null;
            if (req.file) {
                image_url = '/uploads/' + req.file.filename;
            }

            await WebSettingModel.updateBanner(id, {
                title, subtitle, image_url, button_text, button_link,
                display_order: parseInt(display_order || 0),
                is_active: is_active ? 1 : 0
            });

            res.redirect('/settings/web/banners?success=Banner+berhasil+diperbarui');
        } catch (error) {
            console.error('Error WebSettingController updateBanner:', error);
            res.redirect('/settings/web/banners?error=Gagal+memperbarui+banner');
        }
    }

    static async deleteBanner(req, res) {
        try {
            const { id } = req.params;
            await WebSettingModel.deleteBanner(id);
            res.redirect('/settings/web/banners?success=Banner+berhasil+dihapus');
        } catch (error) {
            console.error('Error WebSettingController deleteBanner:', error);
            res.redirect('/settings/web/banners?error=Gagal+menghapus+banner');
        }
    }

    // 3. Pengumuman (/settings/web/announcements)
    static async getAnnouncements(req, res) {
        try {
            const announcements = await WebSettingModel.getAllAnnouncements();
            res.render('settings/web_announcements', {
                title: 'Kelola Pengumuman Masjid',
                activeSubmenu: 'web-announcements',
                announcements,
                successMsg: req.query.success || null,
                errorMsg: req.query.error || null
            });
        } catch (error) {
            console.error('Error WebSettingController getAnnouncements:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    static async createAnnouncement(req, res) {
        try {
            const { title, content, type, start_date, end_date, is_active } = req.body;
            await WebSettingModel.createAnnouncement({
                title, content, type, start_date, end_date, is_active: is_active ? 1 : 0
            });
            res.redirect('/settings/web/announcements?success=Pengumuman+berhasil+dibuat');
        } catch (error) {
            console.error('Error WebSettingController createAnnouncement:', error);
            res.redirect('/settings/web/announcements?error=Gagal+membuat+pengumuman');
        }
    }

    static async updateAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const { title, content, type, start_date, end_date, is_active } = req.body;
            await WebSettingModel.updateAnnouncement(id, {
                title, content, type, start_date, end_date, is_active: is_active ? 1 : 0
            });
            res.redirect('/settings/web/announcements?success=Pengumuman+berhasil+diperbarui');
        } catch (error) {
            console.error('Error WebSettingController updateAnnouncement:', error);
            res.redirect('/settings/web/announcements?error=Gagal+memperbarui+pengumuman');
        }
    }

    static async deleteAnnouncement(req, res) {
        try {
            const { id } = req.params;
            await WebSettingModel.deleteAnnouncement(id);
            res.redirect('/settings/web/announcements?success=Pengumuman+berhasil+dihapus');
        } catch (error) {
            console.error('Error WebSettingController deleteAnnouncement:', error);
            res.redirect('/settings/web/announcements?error=Gagal+menghapus+pengumuman');
        }
    }

    // 4. Berita & Artikel (/settings/web/articles)
    static async getArticles(req, res) {
        try {
            const articles = await WebSettingModel.getAllArticles();
            res.render('settings/web_articles', {
                title: 'Kelola Berita & Artikel',
                activeSubmenu: 'web-articles',
                articles,
                successMsg: req.query.success || null,
                errorMsg: req.query.error || null
            });
        } catch (error) {
            console.error('Error WebSettingController getArticles:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    static async createArticle(req, res) {
        try {
            const { title, slug, category, content, summary, author_name, is_published } = req.body;
            let thumbnail = null;
            if (req.file) {
                thumbnail = '/uploads/' + req.file.filename;
            }

            await WebSettingModel.createArticle({
                title, slug, category, content, summary, thumbnail,
                author_name: author_name || (req.session.user ? req.session.user.full_name : 'Redaksi DKM'),
                is_published: is_published ? 1 : 0
            });

            res.redirect('/settings/web/articles?success=Artikel+berhasil+diterbitkan');
        } catch (error) {
            console.error('Error WebSettingController createArticle:', error);
            res.redirect('/settings/web/articles?error=Gagal+menerbitkan+artikel');
        }
    }

    static async updateArticle(req, res) {
        try {
            const { id } = req.params;
            const { title, slug, category, content, summary, author_name, is_published } = req.body;
            let thumbnail = null;
            if (req.file) {
                thumbnail = '/uploads/' + req.file.filename;
            }

            await WebSettingModel.updateArticle(id, {
                title, slug, category, content, summary, thumbnail,
                author_name, is_published: is_published ? 1 : 0
            });

            res.redirect('/settings/web/articles?success=Artikel+berhasil+diperbarui');
        } catch (error) {
            console.error('Error WebSettingController updateArticle:', error);
            res.redirect('/settings/web/articles?error=Gagal+memperbarui+artikel');
        }
    }

    static async deleteArticle(req, res) {
        try {
            const { id } = req.params;
            await WebSettingModel.deleteArticle(id);
            res.redirect('/settings/web/articles?success=Artikel+berhasil+dihapus');
        } catch (error) {
            console.error('Error WebSettingController deleteArticle:', error);
            res.redirect('/settings/web/articles?error=Gagal+menghapus+artikel');
        }
    }

    // 5. Galeri Foto (/settings/web/galleries)
    static async getGalleries(req, res) {
        try {
            const galleries = await WebSettingModel.getAllGalleries();
            res.render('settings/web_galleries', {
                title: 'Kelola Galeri Foto',
                activeSubmenu: 'web-galleries',
                galleries,
                successMsg: req.query.success || null,
                errorMsg: req.query.error || null
            });
        } catch (error) {
            console.error('Error WebSettingController getGalleries:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    static async createGallery(req, res) {
        try {
            const { title, category, description } = req.body;
            if (!req.file) {
                return res.redirect('/settings/web/galleries?error=Pilih+file+foto+terlebih+dahulu');
            }
            const image_url = '/uploads/' + req.file.filename;

            await WebSettingModel.createGallery({ title, category, image_url, description });
            res.redirect('/settings/web/galleries?success=Foto+berhasil+diunggah+ke+galeri');
        } catch (error) {
            console.error('Error WebSettingController createGallery:', error);
            res.redirect('/settings/web/galleries?error=Gagal+mengunggah+foto');
        }
    }

    static async deleteGallery(req, res) {
        try {
            const { id } = req.params;
            await WebSettingModel.deleteGallery(id);
            res.redirect('/settings/web/galleries?success=Foto+berhasil+dihapus');
        } catch (error) {
            console.error('Error WebSettingController deleteGallery:', error);
            res.redirect('/settings/web/galleries?error=Gagal+menghapus+foto');
        }
    }
}

module.exports = WebSettingController;
