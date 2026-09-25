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
                name, tagline, address, phone, email, vision, mission, history,
                social_facebook, social_instagram, social_youtube, social_whatsapp, social_tiktok,
                hero_title, hero_subtitle, maps_embed, running_text,
                prayer_city, prayer_country, timezone, calculation_method,
                subuh_offset, dzuhur_offset, ashar_offset, maghrib_offset, isya_offset,
                friday_khatib, friday_imam, friday_muadzin, footer_copyright, meta_keywords, meta_description
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
                ...existing,
                name, tagline, address, phone, email, vision, mission, history,
                logo: logoPath,
                favicon: faviconPath,
                social_facebook, social_instagram, social_youtube, social_whatsapp, social_tiktok,
                hero_title, hero_subtitle, maps_embed, running_text,
                prayer_city, prayer_country, timezone, calculation_method,
                subuh_offset, dzuhur_offset, ashar_offset, maghrib_offset, isya_offset,
                friday_khatib, friday_imam, friday_muadzin, footer_copyright, meta_keywords, meta_description
            });

            res.redirect('/settings/web/general?success=Pengaturan+umum+web+berhasil+disimpan');
        } catch (error) {
            console.error('Error WebSettingController updateGeneral:', error);
            res.redirect('/settings/web/general?error=Gagal+menyimpan+pengaturan+web');
        }
    }

    // 2. Pengaturan Menu Website (/settings/web/menus)
    static async getMenus(req, res) {
        try {
            const menus = await WebSettingModel.getAllMenus();
            res.render('settings/web_menus', {
                title: 'Pengaturan Menu Navigasi Web',
                activeSubmenu: 'web-menus',
                menus,
                successMsg: req.query.success || null,
                errorMsg: req.query.error || null
            });
        } catch (error) {
            console.error('Error WebSettingController getMenus:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    static async createMenu(req, res) {
        try {
            const { title, url, target, parent_id, display_order, is_active, is_external } = req.body;
            await WebSettingModel.createMenu({
                title, url, target, parent_id, display_order, is_active: is_active ? 1 : 0, is_external: is_external ? 1 : 0
            });
            res.redirect('/settings/web/menus?success=Menu+baru+berhasil+ditambahkan');
        } catch (error) {
            console.error('Error WebSettingController createMenu:', error);
            res.redirect('/settings/web/menus?error=Gagal+menambahkan+menu');
        }
    }

    static async updateMenu(req, res) {
        try {
            const { id } = req.params;
            const { title, url, target, parent_id, display_order, is_active, is_external } = req.body;
            await WebSettingModel.updateMenu(id, {
                title, url, target, parent_id, display_order, is_active: is_active ? 1 : 0, is_external: is_external ? 1 : 0
            });
            res.redirect('/settings/web/menus?success=Menu+berhasil+diperbarui');
        } catch (error) {
            console.error('Error WebSettingController updateMenu:', error);
            res.redirect('/settings/web/menus?error=Gagal+memperbarui+menu');
        }
    }

    static async toggleMenuStatus(req, res) {
        try {
            const { id } = req.params;
            await WebSettingModel.toggleMenuStatus(id);
            res.redirect('/settings/web/menus?success=Status+menu+berhasil+diubah');
        } catch (error) {
            console.error('Error WebSettingController toggleMenuStatus:', error);
            res.redirect('/settings/web/menus?error=Gagal+mengubah+status+menu');
        }
    }

    static async deleteMenu(req, res) {
        try {
            const { id } = req.params;
            await WebSettingModel.deleteMenu(id);
            res.redirect('/settings/web/menus?success=Menu+berhasil+dihapus');
        } catch (error) {
            console.error('Error WebSettingController deleteMenu:', error);
            res.redirect('/settings/web/menus?error=Gagal+menghapus+menu');
        }
    }

    // 3. Banner / Slide Hero (/settings/web/banners)
    static async getBanners(req, res) {
        try {
            const banners = await WebSettingModel.getAllBanners();
            const profile = await WebSettingModel.getWebProfile();
            res.render('settings/web_banners', {
                title: 'Manajer Banner & Carousel Hero - CMS SIMASJID',
                activeSubmenu: 'web-banners',
                banners,
                profile,
                successMsg: req.query.success || null,
                errorMsg: req.query.error || null
            });
        } catch (error) {
            console.error('Error WebSettingController getBanners:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    static async updateCarouselSettings(req, res) {
        try {
            const { carousel_autoplay, carousel_duration, carousel_nav_arrows } = req.body;
            await WebSettingModel.updateCarouselSettings({
                carousel_autoplay: carousel_autoplay ? 1 : 0,
                carousel_duration: parseInt(carousel_duration || 5000),
                carousel_nav_arrows
            });
            res.redirect('/settings/web/banners?success=Pengaturan+autoplay+carousel+berhasil+disimpan');
        } catch (error) {
            console.error('Error WebSettingController updateCarouselSettings:', error);
            res.redirect('/settings/web/banners?error=Gagal+menyimpan+pengaturan+carousel');
        }
    }

    static async createBanner(req, res) {
        try {
            const {
                title, show_title, subtitle, show_subtitle, button_text, button_link, show_button,
                badge_text, show_badge, fit_mode, focus_position, overlay_darkness, overlay_direction,
                display_order, is_active
            } = req.body;

            let image_url = '/images/hero-default.jpg';
            if (req.file) {
                image_url = '/uploads/' + req.file.filename;
            }

            await WebSettingModel.createBanner({
                title,
                show_title: show_title ? 1 : 0,
                subtitle,
                show_subtitle: show_subtitle ? 1 : 0,
                image_url,
                button_text,
                button_link,
                show_button: show_button ? 1 : 0,
                badge_text,
                show_badge: show_badge ? 1 : 0,
                fit_mode,
                focus_position,
                overlay_darkness,
                overlay_direction,
                display_order: parseInt(display_order || 0),
                is_active: is_active ? 1 : 0
            });

            res.redirect('/settings/web/banners?success=Banner+hero+berhasil+ditambahkan');
        } catch (error) {
            console.error('Error WebSettingController createBanner:', error);
            res.redirect('/settings/web/banners?error=Gagal+menambahkan+banner');
        }
    }

    static async updateBanner(req, res) {
        try {
            const { id } = req.params;
            const {
                title, show_title, subtitle, show_subtitle, button_text, button_link, show_button,
                badge_text, show_badge, fit_mode, focus_position, overlay_darkness, overlay_direction,
                display_order, is_active
            } = req.body;

            let image_url = null;
            if (req.file) {
                image_url = '/uploads/' + req.file.filename;
            }

            await WebSettingModel.updateBanner(id, {
                title,
                show_title: show_title ? 1 : 0,
                subtitle,
                show_subtitle: show_subtitle ? 1 : 0,
                image_url,
                button_text,
                button_link,
                show_button: show_button ? 1 : 0,
                badge_text,
                show_badge: show_badge ? 1 : 0,
                fit_mode,
                focus_position,
                overlay_darkness,
                overlay_direction,
                display_order: parseInt(display_order || 0),
                is_active: is_active ? 1 : 0
            });

            res.redirect('/settings/web/banners?success=Banner+hero+berhasil+diperbarui');
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

    // 4. Pengumuman (/settings/web/announcements)
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

    // 5. Berita & Artikel (/settings/web/articles)
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

    // 6. Galeri Foto (/settings/web/galleries)
    static async getGalleries(req, res) {
        try {
            const selectedCategory = req.query.category || 'Semua';
            const galleries = await WebSettingModel.getAllGalleries({ category: selectedCategory });
            res.render('settings/web_galleries', {
                title: 'Kelola Galeri Foto',
                activeSubmenu: 'web-galleries',
                galleries,
                selectedCategory,
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
            const { title, category, description, event_date } = req.body;
            if (!req.file) {
                return res.redirect('/settings/web/galleries?error=Pilih+file+foto+terlebih+dahulu');
            }
            const image_url = '/uploads/' + req.file.filename;

            await WebSettingModel.createGallery({ title, category, image_url, description, event_date });
            res.redirect('/settings/web/galleries?success=Foto+berhasil+diunggah+ke+galeri');
        } catch (error) {
            console.error('Error WebSettingController createGallery:', error);
            res.redirect('/settings/web/galleries?error=Gagal+mengunggah+foto');
        }
    }

    static async updateGallery(req, res) {
        try {
            const { id } = req.params;
            const { title, category, description, event_date } = req.body;
            let image_url = null;
            if (req.file) {
                image_url = '/uploads/' + req.file.filename;
            }

            await WebSettingModel.updateGallery(id, { title, category, image_url, description, event_date });
            res.redirect('/settings/web/galleries?success=Foto+galeri+berhasil+diperbarui');
        } catch (error) {
            console.error('Error WebSettingController updateGallery:', error);
            res.redirect('/settings/web/galleries?error=Gagal+memperbarui+foto');
        }
    }

    static async deleteGallery(id) {
        await WebSettingModel.deleteGallery(id);
    }

    // 7. Pengaturan Jadwal Sholat & Petugas Jumat (/settings/web/prayer)
    static async getPrayer(req, res) {
        try {
            const profile = await WebSettingModel.getWebProfile();
            res.render('settings/web_prayer', {
                title: 'Pengaturan Jadwal Sholat & Petugas',
                activeSubmenu: 'web-prayer',
                profile,
                successMsg: req.query.success || null,
                errorMsg: req.query.error || null
            });
        } catch (error) {
            console.error('Error WebSettingController getPrayer:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    static async updatePrayer(req, res) {
        try {
            const {
                prayer_city, prayer_country, timezone, calculation_method,
                subuh_offset, dzuhur_offset, ashar_offset, maghrib_offset, isya_offset,
                friday_khatib, friday_imam, friday_muadzin
            } = req.body;

            const existing = await WebSettingModel.getWebProfile();
            await WebSettingModel.updateWebProfile({
                ...existing,
                prayer_city, prayer_country, timezone, calculation_method,
                subuh_offset, dzuhur_offset, ashar_offset, maghrib_offset, isya_offset,
                friday_khatib, friday_imam, friday_muadzin
            });

            res.redirect('/settings/web/prayer?success=Pengaturan+jadwal+sholat+berhasil+disimpan');
        } catch (error) {
            console.error('Error WebSettingController updatePrayer:', error);
            res.redirect('/settings/web/prayer?error=Gagal+menyimpan+pengaturan+sholat');
        }
    }
}

module.exports = WebSettingController;
