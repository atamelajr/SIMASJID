const MasjidModel = require('../models/MasjidModel');
const TransactionModel = require('../models/TransactionModel');
const ProjectModel = require('../models/ProjectModel');
const WebSettingModel = require('../models/WebSettingModel');
const db = require('../../config/database');

class PublicController {
    // 1. Beranda Utama Publik Modern
    static async getHome(req, res) {
        try {
            const summary = await TransactionModel.getDashboardSummary();
            const projects = await ProjectModel.getActiveProjects();
            const dkmMembers = await MasjidModel.getDkmMembers();
            const banners = await WebSettingModel.getActiveBanners();
            const articles = await WebSettingModel.getPublishedArticles(3);
            const galleries = await WebSettingModel.getAllGalleries({ limit: 4 });
            const announcements = await WebSettingModel.getActiveAnnouncements();

            res.render('public/index', {
                title: 'Beranda - SIMASJID Portal Publik',
                layout: 'layout_public',
                currentRoute: 'home',
                summary,
                projects,
                dkmMembers,
                banners,
                articles,
                galleries,
                announcements
            });
        } catch (error) {
            console.error('Error PublicController getHome:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    // 2. Jadwal Sholat & Petugas Jumat
    static async getJadwalSholat(req, res) {
        try {
            res.render('public/jadwal_sholat', {
                title: 'Jadwal Sholat & Petugas Jumat - SIMASJID',
                layout: 'layout_public',
                currentRoute: 'jadwal'
            });
        } catch (error) {
            console.error('Error PublicController getJadwalSholat:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    // 3. Transparansi Keuangan Publik
    static async getTransparansi(req, res) {
        try {
            const [cashAccounts] = await db.query(
                `SELECT * FROM cash_accounts WHERE is_active = 1 ORDER BY id ASC`
            );

            const [recentTransactions] = await db.query(
                `SELECT t.*, c.name as category_name 
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 ORDER BY t.transaction_date DESC, t.id DESC 
                 LIMIT 20`
            );

            res.render('public/transparansi', {
                title: 'Transparansi Keuangan Kas Masjid - SIMASJID',
                layout: 'layout_public',
                currentRoute: 'transparansi',
                cashAccounts,
                recentTransactions
            });
        } catch (error) {
            console.error('Error PublicController getTransparansi:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    // 4. Proyek & Penggalangan Donasi
    static async getProyekDonasi(req, res) {
        try {
            const [cashAccounts] = await db.query(
                `SELECT * FROM cash_accounts WHERE is_active = 1 AND bank_name != 'Kas Tunai'`
            );
            const projects = await ProjectModel.getActiveProjects();

            res.render('public/proyek_donasi', {
                title: 'Proyek & Penggalangan Donasi Masjid - SIMASJID',
                layout: 'layout_public',
                currentRoute: 'proyek',
                cashAccounts,
                projects
            });
        } catch (error) {
            console.error('Error PublicController getProyekDonasi:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    // 5. Berita & Artikel List
    static async getBerita(req, res) {
        try {
            const articles = await WebSettingModel.getAllArticles({ limit: 20 });
            res.render('public/berita', {
                title: 'Berita & Artikel Dakwah - SIMASJID',
                layout: 'layout_public',
                currentRoute: 'berita',
                articles
            });
        } catch (error) {
            console.error('Error PublicController getBerita:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    // 6. Detail Berita / Artikel
    static async getBeritaDetail(req, res) {
        try {
            const { slug } = req.params;
            const article = await WebSettingModel.getArticleBySlug(slug);
            if (!article) {
                return res.status(404).render('errors/404', { title: 'Artikel Tidak Ditemukan', layout: false });
            }

            await WebSettingModel.incrementArticleViews(article.id);

            res.render('public/berita_detail', {
                title: article.title + ' - SIMASJID',
                layout: 'layout_public',
                currentRoute: 'berita',
                article
            });
        } catch (error) {
            console.error('Error PublicController getBeritaDetail:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    // 7. Galeri Foto
    static async getGaleri(req, res) {
        try {
            const galleries = await WebSettingModel.getAllGalleries({ limit: 40 });
            res.render('public/galeri', {
                title: 'Galeri Dokumentasi Foto - SIMASJID',
                layout: 'layout_public',
                currentRoute: 'galeri',
                galleries
            });
        } catch (error) {
            console.error('Error PublicController getGaleri:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    // 8. Pengumuman List
    static async getPengumuman(req, res) {
        try {
            const announcements = await WebSettingModel.getActiveAnnouncements();
            res.render('public/pengumuman', {
                title: 'Pengumuman Masjid - SIMASJID',
                layout: 'layout_public',
                currentRoute: 'pengumuman',
                announcements
            });
        } catch (error) {
            console.error('Error PublicController getPengumuman:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }

    // 9. Display TV Masjid Fullscreen
    static async getDisplayTV(req, res) {
        try {
            const summary = await TransactionModel.getDashboardSummary();
            res.render('public/display_tv', {
                title: 'Display Digital TV - SIMASJID',
                layout: false,
                summary
            });
        } catch (error) {
            console.error('Error PublicController getDisplayTV:', error);
            res.status(500).render('errors/500', { title: '500 Server Error', layout: false });
        }
    }
}

module.exports = PublicController;
