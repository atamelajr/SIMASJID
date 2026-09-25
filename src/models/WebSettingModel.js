const db = require('../../config/database');

class WebSettingModel {
    // Self-healing schema checker (Otomatis menambah kolom baru jika belum ada di database MariaDB)
    static async ensureSchema() {
        const alterProfileQueries = [
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS logo VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS favicon VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS tagline VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS footer_copyright VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS meta_keywords TEXT NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS meta_description TEXT NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_youtube VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_whatsapp VARCHAR(50) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_tiktok VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS hero_title VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS hero_subtitle TEXT NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS maps_embed TEXT NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS running_text TEXT NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS prayer_city VARCHAR(100) DEFAULT 'Jakarta'`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS prayer_country VARCHAR(100) DEFAULT 'Indonesia'`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Jakarta'`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS calculation_method INT DEFAULT 20`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS subuh_offset INT DEFAULT 0`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS dzuhur_offset INT DEFAULT 0`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS ashar_offset INT DEFAULT 0`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS maghrib_offset INT DEFAULT 0`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS isya_offset INT DEFAULT 0`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS friday_khatib VARCHAR(150) DEFAULT 'Ustadz Drs. H. Ahmad Dahlan'`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS friday_imam VARCHAR(150) DEFAULT 'Ust. Muhammad Ridwan, S.Pd.I'`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS friday_muadzin VARCHAR(150) DEFAULT 'Akang Abdullah'`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS carousel_autoplay TINYINT(1) DEFAULT 1`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS carousel_duration INT DEFAULT 5000`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS carousel_nav_arrows VARCHAR(30) DEFAULT 'hover'`
        ];

        for (const q of alterProfileQueries) {
            try {
                await db.query(q);
            } catch (e) {
                // Ignore error if column exists
            }
        }

        const alterBannerQueries = [
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50) NULL`,
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS show_badge TINYINT(1) DEFAULT 1`,
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS show_title TINYINT(1) DEFAULT 1`,
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS show_subtitle TINYINT(1) DEFAULT 1`,
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS fit_mode VARCHAR(30) DEFAULT 'cover'`,
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS focus_position VARCHAR(30) DEFAULT 'center'`,
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS overlay_darkness VARCHAR(30) DEFAULT 'standard'`,
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS overlay_direction VARCHAR(30) DEFAULT 'left'`,
            `ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS show_button TINYINT(1) DEFAULT 1`
        ];
        for (const q of alterBannerQueries) {
            try {
                await db.query(q);
            } catch (e) {}
        }
    }

    // === 1. PENGATURAN UMUM & LOGO ===
    static async getWebProfile() {
        try {
            const [rows] = await db.query(`SELECT * FROM masjid_profile WHERE id = 1`);
            return rows[0] || {};
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
                await this.ensureSchema();
                const [rows] = await db.query(`SELECT * FROM masjid_profile WHERE id = 1`);
                return rows[0] || {};
            }
            throw err;
        }
    }

    static async updateWebProfile(data) {
        const {
            name, tagline, address, phone, email, vision, mission, history,
            logo, favicon, social_facebook, social_instagram, social_youtube,
            social_whatsapp, social_tiktok, hero_title, hero_subtitle, maps_embed, running_text,
            prayer_city, prayer_country, timezone, calculation_method,
            subuh_offset, dzuhur_offset, ashar_offset, maghrib_offset, isya_offset,
            friday_khatib, friday_imam, friday_muadzin, footer_copyright, meta_keywords, meta_description,
            carousel_autoplay, carousel_duration, carousel_nav_arrows
        } = data;

        const executeUpdate = async () => {
            await db.query(`
                UPDATE masjid_profile SET 
                    name=?, tagline=?, address=?, phone=?, email=?, vision=?, mission=?, history=?,
                    logo=?, favicon=?, social_facebook=?, social_instagram=?, social_youtube=?,
                    social_whatsapp=?, social_tiktok=?, hero_title=?, hero_subtitle=?, maps_embed=?, running_text=?,
                    prayer_city=?, prayer_country=?, timezone=?, calculation_method=?,
                    subuh_offset=?, dzuhur_offset=?, ashar_offset=?, maghrib_offset=?, isya_offset=?,
                    friday_khatib=?, friday_imam=?, friday_muadzin=?, footer_copyright=?, meta_keywords=?, meta_description=?,
                    carousel_autoplay=?, carousel_duration=?, carousel_nav_arrows=?
                WHERE id=1
            `, [
                name, tagline || '', address, phone, email, vision || '', mission || '', history || '',
                logo || null, favicon || null, social_facebook || '', social_instagram || '', social_youtube || '',
                social_whatsapp || '', social_tiktok || '', hero_title || '', hero_subtitle || '', maps_embed || '', running_text || '',
                prayer_city || 'Jakarta', prayer_country || 'Indonesia', timezone || 'Asia/Jakarta', parseInt(calculation_method || 20),
                parseInt(subuh_offset || 0), parseInt(dzuhur_offset || 0), parseInt(ashar_offset || 0), parseInt(maghrib_offset || 0), parseInt(isya_offset || 0),
                friday_khatib || '', friday_imam || '', friday_muadzin || '', footer_copyright || '', meta_keywords || '', meta_description || '',
                carousel_autoplay ?? 1, parseInt(carousel_duration || 5000), carousel_nav_arrows || 'hover'
            ]);
        };

        try {
            await executeUpdate();
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
                console.log('🔄 Menjalankan auto-migration penambahan kolom masjid_profile...');
                await this.ensureSchema();
                await executeUpdate();
            } else {
                throw err;
            }
        }
    }

    static async updateCarouselSettings({ carousel_autoplay, carousel_duration, carousel_nav_arrows }) {
        await this.ensureSchema();
        await db.query(`
            UPDATE masjid_profile SET
                carousel_autoplay = ?,
                carousel_duration = ?,
                carousel_nav_arrows = ?
            WHERE id = 1
        `, [carousel_autoplay ? 1 : 0, parseInt(carousel_duration || 5000), carousel_nav_arrows || 'hover']);
    }

    // === 2. PENGATURAN MENU WEBSITE (NAVBAR FRONTEND) ===
    static async getAllMenus() {
        try {
            const [rows] = await db.query(`SELECT * FROM web_menus ORDER BY display_order ASC, id ASC`);
            return rows;
        } catch (err) {
            return [];
        }
    }

    static async getActiveMenus() {
        try {
            const [rows] = await db.query(`SELECT * FROM web_menus WHERE is_active = 1 ORDER BY display_order ASC, id ASC`);
            return rows;
        } catch (err) {
            return [];
        }
    }

    static async createMenu({ title, url, target, parent_id, display_order, is_active, is_external }) {
        const [result] = await db.query(`
            INSERT INTO web_menus (title, url, target, parent_id, display_order, is_active, is_external)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            title,
            url,
            target || '_self',
            parent_id ? parseInt(parent_id) : null,
            parseInt(display_order || 0),
            is_active ?? 1,
            is_external ? 1 : 0
        ]);
        return result.insertId;
    }

    static async updateMenu(id, { title, url, target, parent_id, display_order, is_active, is_external }) {
        await db.query(`
            UPDATE web_menus SET 
                title=?, url=?, target=?, parent_id=?, display_order=?, is_active=?, is_external=?
            WHERE id=?
        `, [
            title,
            url,
            target || '_self',
            parent_id ? parseInt(parent_id) : null,
            parseInt(display_order || 0),
            is_active ?? 1,
            is_external ? 1 : 0,
            id
        ]);
    }

    static async toggleMenuStatus(id) {
        await db.query(`UPDATE web_menus SET is_active = IF(is_active=1, 0, 1) WHERE id = ?`, [id]);
    }

    static async deleteMenu(id) {
        await db.query(`DELETE FROM web_menus WHERE id = ?`, [id]);
    }

    // === 3. KELOLA BANNER / SLIDE HERO ===
    static async getAllBanners() {
        await this.ensureSchema();
        const [rows] = await db.query(`SELECT * FROM web_banners ORDER BY display_order ASC, id DESC`);
        return rows;
    }

    static async getActiveBanners() {
        await this.ensureSchema();
        const [rows] = await db.query(`SELECT * FROM web_banners WHERE is_active = 1 ORDER BY display_order ASC, id DESC`);
        return rows;
    }

    static async createBanner({
        title, show_title, subtitle, show_subtitle, image_url, button_text, button_link, show_button,
        badge_text, show_badge, fit_mode, focus_position, overlay_darkness, overlay_direction,
        display_order, is_active
    }) {
        await this.ensureSchema();
        const [result] = await db.query(`
            INSERT INTO web_banners (
                title, show_title, subtitle, show_subtitle, image_url, button_text, button_link, show_button,
                badge_text, show_badge, fit_mode, focus_position, overlay_darkness, overlay_direction,
                display_order, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, show_title ?? 1, subtitle || '', show_subtitle ?? 1, image_url,
            button_text || '', button_link || '', show_button ?? 1,
            badge_text || '', show_badge ?? 1, fit_mode || 'cover', focus_position || 'center',
            overlay_darkness || 'standard', overlay_direction || 'left',
            display_order || 0, is_active ?? 1
        ]);
        return result.insertId;
    }

    static async updateBanner(id, {
        title, show_title, subtitle, show_subtitle, image_url, button_text, button_link, show_button,
        badge_text, show_badge, fit_mode, focus_position, overlay_darkness, overlay_direction,
        display_order, is_active
    }) {
        await this.ensureSchema();
        const [rows] = await db.query(`SELECT image_url FROM web_banners WHERE id = ?`, [id]);
        const oldImage = rows[0]?.image_url;
        const newImage = image_url || oldImage;

        await db.query(`
            UPDATE web_banners SET 
                title=?, show_title=?, subtitle=?, show_subtitle=?, image_url=?, button_text=?, button_link=?, show_button=?,
                badge_text=?, show_badge=?, fit_mode=?, focus_position=?, overlay_darkness=?, overlay_direction=?,
                display_order=?, is_active=?
            WHERE id=?
        `, [
            title, show_title ?? 1, subtitle || '', show_subtitle ?? 1, newImage,
            button_text || '', button_link || '', show_button ?? 1,
            badge_text || '', show_badge ?? 1, fit_mode || 'cover', focus_position || 'center',
            overlay_darkness || 'standard', overlay_direction || 'left',
            display_order || 0, is_active ?? 1, id
        ]);
    }

    static async deleteBanner(id) {
        await db.query(`DELETE FROM web_banners WHERE id = ?`, [id]);
    }

    // === 4. KELOLA PENGUMUMAN ===
    static async getAllAnnouncements() {
        const [rows] = await db.query(`SELECT * FROM web_announcements ORDER BY created_at DESC`);
        return rows;
    }

    static async getActiveAnnouncements() {
        const [rows] = await db.query(`SELECT * FROM web_announcements WHERE is_active = 1 ORDER BY created_at DESC`);
        return rows;
    }

    static async createAnnouncement({ title, content, type, start_date, end_date, is_active }) {
        await db.query(`
            INSERT INTO web_announcements (title, content, type, start_date, end_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [title, content, type || 'Umum', start_date || null, end_date || null, is_active ?? 1]);
    }

    static async updateAnnouncement(id, { title, content, type, start_date, end_date, is_active }) {
        await db.query(`
            UPDATE web_announcements SET
                title=?, content=?, type=?, start_date=?, end_date=?, is_active=?
            WHERE id=?
        `, [title, content, type || 'Umum', start_date || null, end_date || null, is_active ?? 1, id]);
    }

    static async deleteAnnouncement(id) {
        await db.query(`DELETE FROM web_announcements WHERE id = ?`, [id]);
    }

    // === 5. KELOLA BERITA / ARTIKEL ===
    static async getAllArticles({ category, search, limit = 20, offset = 0 } = {}) {
        let sql = `SELECT * FROM web_articles WHERE 1=1`;
        const params = [];

        if (category) {
            sql += ` AND category = ?`;
            params.push(category);
        }
        if (search) {
            sql += ` AND (title LIKE ? OR content LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async getPublishedArticles(limit = 10) {
        const [rows] = await db.query(`SELECT * FROM web_articles WHERE is_published = 1 ORDER BY created_at DESC LIMIT ?`, [parseInt(limit)]);
        return rows;
    }

    static async getArticleBySlug(slug) {
        const [rows] = await db.query(`SELECT * FROM web_articles WHERE slug = ?`, [slug]);
        return rows[0] || null;
    }

    static async getArticleById(id) {
        const [rows] = await db.query(`SELECT * FROM web_articles WHERE id = ?`, [id]);
        return rows[0] || null;
    }

    static async createArticle({ title, slug, category, content, summary, thumbnail, author_name, is_published }) {
        const finalSlug = slug && slug.trim() !== '' 
            ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

        await db.query(`
            INSERT INTO web_articles (title, slug, category, content, summary, thumbnail, author_name, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, finalSlug, category || 'Kajian & Dakwah', content, summary || '', thumbnail || null, author_name || 'Redaksi DKM', is_published ?? 1]);
    }

    static async updateArticle(id, { title, slug, category, content, summary, thumbnail, author_name, is_published }) {
        const [rows] = await db.query(`SELECT thumbnail FROM web_articles WHERE id = ?`, [id]);
        const oldThumb = rows[0]?.thumbnail;
        const newThumb = thumbnail || oldThumb;

        const finalSlug = slug && slug.trim() !== '' 
            ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        await db.query(`
            UPDATE web_articles SET
                title=?, slug=?, category=?, content=?, summary=?, thumbnail=?, author_name=?, is_published=?
            WHERE id=?
        `, [title, finalSlug, category || 'Kajian & Dakwah', content, summary || '', newThumb, author_name || 'Redaksi DKM', is_published ?? 1, id]);
    }

    static async deleteArticle(id) {
        await db.query(`DELETE FROM web_articles WHERE id = ?`, [id]);
    }

    static async incrementArticleViews(id) {
        await db.query(`UPDATE web_articles SET views = views + 1 WHERE id = ?`, [id]);
    }

    // === 6. KELOLA GALERI FOTO ===
    static async getAllGalleries({ category, limit = 50 } = {}) {
        let sql = `SELECT * FROM web_galleries WHERE 1=1`;
        const params = [];

        if (category && category !== 'Semua') {
            sql += ` AND category = ?`;
            params.push(category);
        }

        sql += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async createGallery({ title, category, image_url, description, event_date }) {
        await db.query(`
            INSERT INTO web_galleries (title, category, image_url, description, event_date)
            VALUES (?, ?, ?, ?, ?)
        `, [title, category || 'Kegiatan', image_url, description || '', event_date || null]);
    }

    static async updateGallery(id, { title, category, image_url, description, event_date }) {
        const [rows] = await db.query(`SELECT image_url FROM web_galleries WHERE id = ?`, [id]);
        const oldImage = rows[0]?.image_url;
        const newImage = image_url || oldImage;

        await db.query(`
            UPDATE web_galleries SET
                title=?, category=?, image_url=?, description=?, event_date=?
            WHERE id=?
        `, [title, category || 'Kegiatan', newImage, description || '', event_date || null, id]);
    }

    static async deleteGallery(id) {
        await db.query(`DELETE FROM web_galleries WHERE id = ?`, [id]);
    }
}

module.exports = WebSettingModel;
