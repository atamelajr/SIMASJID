const db = require('../../config/database');

class WebSettingModel {
    // === 1. PENGATURAN UMUM & LOGO ===
    static async getWebProfile() {
        const [rows] = await db.query(`SELECT * FROM masjid_profile WHERE id = 1`);
        return rows[0] || {};
    }

    static async updateWebProfile(data) {
        const {
            name, address, phone, email, vision, mission, history,
            logo, favicon, social_facebook, social_instagram, social_youtube,
            social_whatsapp, hero_title, hero_subtitle, maps_embed, running_text
        } = data;

        await db.query(`
            UPDATE masjid_profile SET 
                name=?, address=?, phone=?, email=?, vision=?, mission=?, history=?,
                logo=?, favicon=?, social_facebook=?, social_instagram=?, social_youtube=?,
                social_whatsapp=?, hero_title=?, hero_subtitle=?, maps_embed=?, running_text=?
            WHERE id=1
        `, [
            name, address, phone, email, vision || '', mission || '', history || '',
            logo || null, favicon || null, social_facebook || '', social_instagram || '', social_youtube || '',
            social_whatsapp || '', hero_title || '', hero_subtitle || '', maps_embed || '', running_text || ''
        ]);
    }

    // === 2. KELOLA BANNER / SLIDE HERO ===
    static async getAllBanners() {
        const [rows] = await db.query(`SELECT * FROM web_banners ORDER BY display_order ASC, id DESC`);
        return rows;
    }

    static async getActiveBanners() {
        const [rows] = await db.query(`SELECT * FROM web_banners WHERE is_active = 1 ORDER BY display_order ASC, id DESC`);
        return rows;
    }

    static async createBanner({ title, subtitle, image_url, button_text, button_link, display_order, is_active }) {
        const [result] = await db.query(`
            INSERT INTO web_banners (title, subtitle, image_url, button_text, button_link, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, subtitle || '', image_url, button_text || '', button_link || '', display_order || 0, is_active ?? 1]);
        return result.insertId;
    }

    static async updateBanner(id, { title, subtitle, image_url, button_text, button_link, display_order, is_active }) {
        const [rows] = await db.query(`SELECT image_url FROM web_banners WHERE id = ?`, [id]);
        const oldImage = rows[0]?.image_url;
        const newImage = image_url || oldImage;

        await db.query(`
            UPDATE web_banners SET 
                title=?, subtitle=?, image_url=?, button_text=?, button_link=?, display_order=?, is_active=?
            WHERE id=?
        `, [title, subtitle || '', newImage, button_text || '', button_link || '', display_order || 0, is_active ?? 1, id]);
    }

    static async deleteBanner(id) {
        await db.query(`DELETE FROM web_banners WHERE id = ?`, [id]);
    }

    // === 3. KELOLA PENGUMUMAN ===
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

    // === 4. KELOLA BERITA / ARTIKEL ===
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
        // Auto generate slug if empty
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

    // === 5. KELOLA GALERI FOTO ===
    static async getAllGalleries({ category, limit = 30 } = {}) {
        let sql = `SELECT * FROM web_galleries WHERE 1=1`;
        const params = [];

        if (category) {
            sql += ` AND category = ?`;
            params.push(category);
        }

        sql += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async createGallery({ title, category, image_url, description }) {
        await db.query(`
            INSERT INTO web_galleries (title, category, image_url, description)
            VALUES (?, ?, ?, ?)
        `, [title, category || 'Kegiatan', image_url, description || '']);
    }

    static async deleteGallery(id) {
        await db.query(`DELETE FROM web_galleries WHERE id = ?`, [id]);
    }
}

module.exports = WebSettingModel;
