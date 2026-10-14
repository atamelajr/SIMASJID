const db = require('../../config/database');

class WebSettingModel {
    // Helper pengecekan & penambahan kolom yang kompatibel dengan semua versi MySQL & MariaDB
    static async ensureColumn(tableName, columnName, columnDefinition) {
        try {
            const [cols] = await db.query(`SHOW COLUMNS FROM \`${tableName}\` LIKE ?`, [columnName]);
            if (cols.length === 0) {
                await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
                console.log(`✅ Kolom '${columnName}' berhasil ditambahkan ke '${tableName}'`);
            }
        } catch (err) {
            try {
                await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
            } catch (e) {}
        }
    }

    // Self-healing schema checker (Otomatis membuat tabel & menambah kolom baru jika belum ada di database)
    static async ensureSchema() {
        // 1. Buat Tabel-tabel CMS Web jika belum ada
        await db.query(`
            CREATE TABLE IF NOT EXISTS web_menus (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                url VARCHAR(255) NOT NULL,
                target VARCHAR(20) DEFAULT '_self',
                parent_id INT NULL,
                display_order INT DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                is_external TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS friday_officers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                friday_date DATE NOT NULL,
                khatib VARCHAR(150) NOT NULL,
                imam VARCHAR(150) NOT NULL,
                muadzin VARCHAR(150) NOT NULL,
                notes VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS web_banners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                subtitle TEXT NULL,
                image_url VARCHAR(255) NOT NULL,
                button_text VARCHAR(50) NULL,
                button_link VARCHAR(255) NULL,
                badge_text VARCHAR(50) NULL,
                show_badge TINYINT(1) DEFAULT 1,
                show_title TINYINT(1) DEFAULT 1,
                show_subtitle TINYINT(1) DEFAULT 1,
                fit_mode VARCHAR(30) DEFAULT 'cover',
                focus_position VARCHAR(30) DEFAULT 'center',
                overlay_darkness VARCHAR(30) DEFAULT 'standard',
                overlay_direction VARCHAR(30) DEFAULT 'left',
                show_button TINYINT(1) DEFAULT 1,
                display_order INT DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS web_announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                content TEXT NOT NULL,
                type ENUM('Penting', 'Kegiatan', 'Umum', 'RunningText') DEFAULT 'Umum',
                start_date DATE NULL,
                end_date DATE NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS web_articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                slug VARCHAR(200) NOT NULL UNIQUE,
                category VARCHAR(50) DEFAULT 'Kajian & Dakwah',
                content LONGTEXT NOT NULL,
                summary TEXT NULL,
                thumbnail VARCHAR(255) NULL,
                author_name VARCHAR(100) DEFAULT 'Redaksi DKM',
                views INT DEFAULT 0,
                is_published TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS web_galleries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                category VARCHAR(50) DEFAULT 'Kegiatan',
                image_url VARCHAR(255) NOT NULL,
                description TEXT NULL,
                event_date DATE NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // Tabel web_albums (Album Galeri Dokumentasi)
        await db.query(`
            CREATE TABLE IF NOT EXISTS web_albums (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                slug VARCHAR(200) NOT NULL UNIQUE,
                category VARCHAR(50) DEFAULT 'Kegiatan',
                cover_image VARCHAR(255) NULL,
                description TEXT NULL,
                event_date DATE NULL,
                show_on_home TINYINT(1) DEFAULT 1,
                is_published TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        // Tabel web_album_photos (Foto-foto di dalam Album)
        await db.query(`
            CREATE TABLE IF NOT EXISTS web_album_photos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                album_id INT NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                caption VARCHAR(255) NULL,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_album (album_id)
            ) ENGINE=InnoDB;
        `);

        // Auto-migrasi foto dari web_galleries ke web_albums jika web_albums masih kosong
        try {
            const [albumRows] = await db.query(`SELECT COUNT(*) as count FROM web_albums`);
            if (albumRows[0].count === 0) {
                const [existingGalleries] = await db.query(`SELECT * FROM web_galleries ORDER BY id ASC`);
                if (existingGalleries && existingGalleries.length > 0) {
                    const groups = {};
                    existingGalleries.forEach(g => {
                        const cleanTitle = (g.title || 'Dokumentasi Kegiatan').replace(/\s*\(\d+\)$/, '').trim();
                        if (!groups[cleanTitle]) {
                            groups[cleanTitle] = {
                                title: cleanTitle,
                                category: g.category || 'Kegiatan',
                                description: g.description || '',
                                event_date: g.event_date || null,
                                cover_image: g.image_url,
                                photos: []
                            };
                        }
                        groups[cleanTitle].photos.push({
                            image_url: g.image_url,
                            caption: g.title
                        });
                    });

                    for (const key of Object.keys(groups)) {
                        const grp = groups[key];
                        const baseSlug = grp.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'album';
                        const slug = baseSlug + '-' + Math.floor(1000 + Math.random() * 9000);
                        const [res] = await db.query(`
                            INSERT INTO web_albums (title, slug, category, cover_image, description, event_date, show_on_home, is_published)
                            VALUES (?, ?, ?, ?, ?, ?, 1, 1)
                        `, [grp.title, slug, grp.category, grp.cover_image, grp.description, grp.event_date]);
                        const albumId = res.insertId;

                        for (let i = 0; i < grp.photos.length; i++) {
                            await db.query(`
                                INSERT INTO web_album_photos (album_id, image_url, caption, display_order)
                                VALUES (?, ?, ?, ?)
                            `, [albumId, grp.photos[i].image_url, grp.photos[i].caption, i + 1]);
                        }
                    }
                    console.log(`✅ Berhasil auto-migrasi ${existingGalleries.length} foto ke web_albums!`);
                }
            }
        } catch (migErr) {
            console.warn('Auto-migration web_albums notice:', migErr.message);
        }

        // Seed default web_menus jika kosong
        try {
            const [menuRows] = await db.query(`SELECT COUNT(*) as count FROM web_menus`);
            if (menuRows[0].count === 0) {
                await db.query(`
                    INSERT INTO web_menus (title, url, target, display_order, is_active) VALUES
                    ('Beranda', '/', '_self', 1, 1),
                    ('Jadwal Sholat', '/jadwal-sholat', '_self', 2, 1),
                    ('Transparansi Kas', '/transparansi', '_self', 3, 1),
                    ('Proyek Donasi', '/proyek-donasi', '_self', 4, 1),
                    ('Berita & Artikel', '/berita', '_self', 5, 1),
                    ('Galeri Foto', '/galeri', '_self', 6, 1),
                    ('Mode TV', '/display-tv', '_blank', 7, 1)
                `);
            }
        } catch (e) {}

        // Pastikan kolom event_date ada pada tabel web_galleries
        await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');

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
            if (err.code === 'ER_NO_SUCH_TABLE') {
                await this.ensureSchema();
                const [rows] = await db.query(`SELECT * FROM web_menus ORDER BY display_order ASC, id ASC`);
                return rows;
            }
            return [];
        }
    }

    static async getActiveMenus() {
        try {
            const [rows] = await db.query(`SELECT * FROM web_menus WHERE is_active = 1 ORDER BY display_order ASC, id ASC`);
            return rows;
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                await this.ensureSchema();
                const [rows] = await db.query(`SELECT * FROM web_menus WHERE is_active = 1 ORDER BY display_order ASC, id ASC`);
                return rows;
            }
            return [];
        }
    }

    static async createMenu({ title, url, target, parent_id, display_order, is_active, is_external }) {
        await this.ensureSchema();
        const execute = async () => {
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
        };

        try {
            return await execute();
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                await this.ensureSchema();
                return await execute();
            }
            throw err;
        }
    }

    static async updateMenu(id, { title, url, target, parent_id, display_order, is_active, is_external }) {
        await this.ensureSchema();
        const execute = async () => {
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
        };

        try {
            await execute();
        } catch (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                await this.ensureSchema();
                await execute();
            } else {
                throw err;
            }
        }
    }

    static async toggleMenuStatus(id) {
        await this.ensureSchema();
        await db.query(`UPDATE web_menus SET is_active = IF(is_active=1, 0, 1) WHERE id = ?`, [id]);
    }

    static async deleteMenu(id) {
        await this.ensureSchema();
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
    static async getAllGalleries({ category, limit = 100 } = {}) {
        await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');

        let sql = `SELECT * FROM web_galleries WHERE 1=1`;
        const params = [];

        if (category && category !== 'Semua') {
            sql += ` AND category = ?`;
            params.push(category);
        }

        sql += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        try {
            const [rows] = await db.query(sql, params);
            return rows;
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
                await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');
                const [rows] = await db.query(sql, params);
                return rows;
            }
            throw err;
        }
    }

    static async getGalleryCategoryCounts() {
        const [rows] = await db.query(`
            SELECT category, COUNT(*) as count 
            FROM web_galleries 
            GROUP BY category
        `);
        const [totalRow] = await db.query(`SELECT COUNT(*) as total FROM web_galleries`);
        const map = { 'Semua': totalRow[0]?.total || 0 };
        rows.forEach(r => { map[r.category] = r.count; });
        return map;
    }

    static async createGallery({ title, category, image_url, description, event_date }) {
        await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');

        try {
            await db.query(`
                INSERT INTO web_galleries (title, category, image_url, description, event_date)
                VALUES (?, ?, ?, ?, ?)
            `, [title, category || 'Kegiatan', image_url, description || '', event_date || null]);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
                await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');
                try {
                    await db.query(`
                        INSERT INTO web_galleries (title, category, image_url, description, event_date)
                        VALUES (?, ?, ?, ?, ?)
                    `, [title, category || 'Kegiatan', image_url, description || '', event_date || null]);
                } catch (retryErr) {
                    // Fallback jika database menolak kolom event_date: simpan tanpa event_date
                    await db.query(`
                        INSERT INTO web_galleries (title, category, image_url, description)
                        VALUES (?, ?, ?, ?)
                    `, [title, category || 'Kegiatan', image_url, description || '']);
                }
            } else {
                throw err;
            }
        }
    }

    static async createMultipleGalleries(items) {
        if (!items || items.length === 0) return;
        await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');

        const valuesWithDate = items.map(g => [
            g.title,
            g.category || 'Kegiatan',
            g.image_url,
            g.description || '',
            g.event_date || null
        ]);

        try {
            await db.query(`
                INSERT INTO web_galleries (title, category, image_url, description, event_date)
                VALUES ?
            `, [valuesWithDate]);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
                await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');
                try {
                    await db.query(`
                        INSERT INTO web_galleries (title, category, image_url, description, event_date)
                        VALUES ?
                    `, [valuesWithDate]);
                } catch (retryErr) {
                    // Fallback jika database menolak kolom event_date: simpan tanpa event_date
                    const valuesWithoutDate = items.map(g => [
                        g.title,
                        g.category || 'Kegiatan',
                        g.image_url,
                        g.description || ''
                    ]);
                    await db.query(`
                        INSERT INTO web_galleries (title, category, image_url, description)
                        VALUES ?
                    `, [valuesWithoutDate]);
                }
            } else {
                throw err;
            }
        }
    }

    static async updateGallery(id, { title, category, image_url, description, event_date }) {
        await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');

        const [rows] = await db.query(`SELECT image_url FROM web_galleries WHERE id = ?`, [id]);
        const oldImage = rows[0]?.image_url;
        const newImage = image_url || oldImage;

        // Jika gambar diganti dan ada gambar lama, hapus gambar lama dari disk
        if (image_url && oldImage && oldImage !== image_url && oldImage.startsWith('/uploads/')) {
            const fs = require('fs');
            const path = require('path');
            const oldPath = path.join(__dirname, '../../public', oldImage);
            fs.unlink(oldPath, () => {});
        }

        try {
            await db.query(`
                UPDATE web_galleries SET
                    title=?, category=?, image_url=?, description=?, event_date=?
                WHERE id=?
            `, [title, category || 'Kegiatan', newImage, description || '', event_date || null, id]);
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
                await this.ensureColumn('web_galleries', 'event_date', 'DATE NULL');
                try {
                    await db.query(`
                        UPDATE web_galleries SET
                            title=?, category=?, image_url=?, description=?, event_date=?
                        WHERE id=?
                    `, [title, category || 'Kegiatan', newImage, description || '', event_date || null, id]);
                } catch (retryErr) {
                    await db.query(`
                        UPDATE web_galleries SET
                            title=?, category=?, image_url=?, description=?
                        WHERE id=?
                    `, [title, category || 'Kegiatan', newImage, description || '', id]);
                }
            } else {
                throw err;
            }
        }
    }

    static async deleteGallery(id) {
        const [rows] = await db.query(`SELECT image_url FROM web_galleries WHERE id = ?`, [id]);
        await db.query(`DELETE FROM web_galleries WHERE id = ?`, [id]);

        if (rows[0]?.image_url && rows[0].image_url.startsWith('/uploads/')) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../../public', rows[0].image_url);
            fs.unlink(filePath, () => {});
        }
    }

    static async bulkDeleteGalleries(ids) {
        if (!ids || ids.length === 0) return;
        const [rows] = await db.query(`SELECT image_url FROM web_galleries WHERE id IN (?)`, [ids]);
        await db.query(`DELETE FROM web_galleries WHERE id IN (?)`, [ids]);

        const fs = require('fs');
        const path = require('path');
        rows.forEach(r => {
            if (r.image_url && r.image_url.startsWith('/uploads/')) {
                const filePath = path.join(__dirname, '../../public', r.image_url);
                fs.unlink(filePath, () => {});
            }
        });
    }

    // === 6B. KELOLA ALBUM DOKUMENTASI (MULTI-FOTO PER ALBUM) ===
    static async getAllAlbums({ category, limit = 50, onlyPublished = false } = {}) {
        await this.ensureSchema();
        let sql = `
            SELECT a.*, 
                   COUNT(p.id) AS photo_count,
                   GROUP_CONCAT(p.image_url ORDER BY p.display_order ASC, p.id ASC SEPARATOR '||') AS preview_photos
            FROM web_albums a
            LEFT JOIN web_album_photos p ON a.id = p.album_id
            WHERE 1=1
        `;
        const params = [];

        if (onlyPublished) {
            sql += ` AND a.is_published = 1`;
        }

        if (category && category !== 'Semua') {
            sql += ` AND a.category = ?`;
            params.push(category);
        }

        sql += ` GROUP BY a.id ORDER BY a.event_date DESC, a.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [rows] = await db.query(sql, params);
        return rows.map(r => ({
            ...r,
            preview_photos: r.preview_photos ? r.preview_photos.split('||') : []
        }));
    }

    static async getHomeAlbums(limit = 4) {
        await this.ensureSchema();
        const sql = `
            SELECT a.*, 
                   COUNT(p.id) AS photo_count,
                   GROUP_CONCAT(p.image_url ORDER BY p.display_order ASC, p.id ASC SEPARATOR '||') AS preview_photos
            FROM web_albums a
            LEFT JOIN web_album_photos p ON a.id = p.album_id
            WHERE a.is_published = 1 AND a.show_on_home = 1
            GROUP BY a.id
            ORDER BY a.event_date DESC, a.created_at DESC
            LIMIT ?
        `;
        const [rows] = await db.query(sql, [parseInt(limit)]);
        return rows.map(r => ({
            ...r,
            preview_photos: r.preview_photos ? r.preview_photos.split('||') : []
        }));
    }

    static async getAlbumById(id) {
        await this.ensureSchema();
        const [rows] = await db.query(`SELECT * FROM web_albums WHERE id = ?`, [id]);
        if (!rows || rows.length === 0) return null;
        const album = rows[0];
        const [photos] = await db.query(`SELECT * FROM web_album_photos WHERE album_id = ? ORDER BY display_order ASC, id ASC`, [id]);
        album.photos = photos || [];
        return album;
    }

    static async getAlbumBySlug(slug) {
        await this.ensureSchema();
        const [rows] = await db.query(`SELECT * FROM web_albums WHERE slug = ?`, [slug]);
        if (!rows || rows.length === 0) return null;
        const album = rows[0];
        const [photos] = await db.query(`SELECT * FROM web_album_photos WHERE album_id = ? ORDER BY display_order ASC, id ASC`, [album.id]);
        album.photos = photos || [];
        return album;
    }

    static async getAlbumCategoryCounts() {
        await this.ensureSchema();
        const [rows] = await db.query(`
            SELECT category, COUNT(*) as count 
            FROM web_albums 
            GROUP BY category
        `);
        const [totalRow] = await db.query(`SELECT COUNT(*) as total FROM web_albums`);
        const map = { 'Semua': totalRow[0]?.total || 0 };
        rows.forEach(r => { map[r.category] = r.count; });
        return map;
    }

    static async createAlbum({ title, category, description, event_date, show_on_home, is_published, photos }) {
        await this.ensureSchema();
        const finalSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
        const cover_image = (photos && photos.length > 0) ? photos[0].image_url : null;

        const [res] = await db.query(`
            INSERT INTO web_albums (title, slug, category, cover_image, description, event_date, show_on_home, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title,
            finalSlug,
            category || 'Kegiatan',
            cover_image,
            description || '',
            event_date || null,
            show_on_home ? 1 : 0,
            is_published ? 1 : 0
        ]);
        const albumId = res.insertId;

        if (photos && photos.length > 0) {
            const values = photos.map((p, idx) => [
                albumId,
                p.image_url,
                p.caption || null,
                idx + 1
            ]);
            await db.query(`
                INSERT INTO web_album_photos (album_id, image_url, caption, display_order)
                VALUES ?
            `, [values]);
        }
        return albumId;
    }

    static async updateAlbum(id, { title, category, description, event_date, show_on_home, is_published, cover_image }) {
        await this.ensureSchema();
        const [curr] = await db.query(`SELECT * FROM web_albums WHERE id = ?`, [id]);
        if (!curr || curr.length === 0) return;

        const finalCover = cover_image || curr[0].cover_image;
        await db.query(`
            UPDATE web_albums SET
                title = ?,
                category = ?,
                description = ?,
                event_date = ?,
                show_on_home = ?,
                is_published = ?,
                cover_image = ?
            WHERE id = ?
        `, [
            title,
            category || 'Kegiatan',
            description || '',
            event_date || null,
            show_on_home ? 1 : 0,
            is_published ? 1 : 0,
            finalCover,
            id
        ]);
    }

    static async toggleAlbumHome(id) {
        await this.ensureSchema();
        await db.query(`UPDATE web_albums SET show_on_home = IF(show_on_home = 1, 0, 1) WHERE id = ?`, [id]);
    }

    static async deleteAlbum(id) {
        await this.ensureSchema();
        const [photos] = await db.query(`SELECT image_url FROM web_album_photos WHERE album_id = ?`, [id]);
        await db.query(`DELETE FROM web_album_photos WHERE album_id = ?`, [id]);
        await db.query(`DELETE FROM web_albums WHERE id = ?`, [id]);

        const fs = require('fs');
        const path = require('path');
        photos.forEach(p => {
            if (p.image_url && p.image_url.startsWith('/uploads/')) {
                const filePath = path.join(__dirname, '../../public', p.image_url);
                fs.unlink(filePath, () => {});
            }
        });
    }

    static async addPhotosToAlbum(albumId, photos) {
        if (!photos || photos.length === 0) return;
        await this.ensureSchema();

        const [currCount] = await db.query(`SELECT COUNT(*) as count FROM web_album_photos WHERE album_id = ?`, [albumId]);
        let startOrder = (currCount[0]?.count || 0) + 1;

        const values = photos.map((p, idx) => [
            albumId,
            p.image_url,
            p.caption || null,
            startOrder + idx
        ]);

        await db.query(`
            INSERT INTO web_album_photos (album_id, image_url, caption, display_order)
            VALUES ?
        `, [values]);

        // Jika album belum punya cover_image, jadikan foto pertama sebagai cover
        const [album] = await db.query(`SELECT cover_image FROM web_albums WHERE id = ?`, [albumId]);
        if (!album[0]?.cover_image && photos.length > 0) {
            await db.query(`UPDATE web_albums SET cover_image = ? WHERE id = ?`, [photos[0].image_url, albumId]);
        }
    }

    static async deleteAlbumPhoto(photoId) {
        await this.ensureSchema();
        const [rows] = await db.query(`SELECT album_id, image_url FROM web_album_photos WHERE id = ?`, [photoId]);
        if (!rows || rows.length === 0) return;
        const { album_id, image_url } = rows[0];

        await db.query(`DELETE FROM web_album_photos WHERE id = ?`, [photoId]);

        // Hapus file fisik
        if (image_url && image_url.startsWith('/uploads/')) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../../public', image_url);
            fs.unlink(filePath, () => {});
        }

        // Cek jika cover album sama dengan foto yang dihapus, ganti dengan foto lain
        const [album] = await db.query(`SELECT cover_image FROM web_albums WHERE id = ?`, [album_id]);
        if (album[0]?.cover_image === image_url) {
            const [nextPhoto] = await db.query(`SELECT image_url FROM web_album_photos WHERE album_id = ? LIMIT 1`, [album_id]);
            const newCover = nextPhoto[0]?.image_url || null;
            await db.query(`UPDATE web_albums SET cover_image = ? WHERE id = ?`, [newCover, album_id]);
        }
    }

    static async setCoverPhoto(albumId, photoUrl) {
        await this.ensureSchema();
        await db.query(`UPDATE web_albums SET cover_image = ? WHERE id = ?`, [photoUrl, albumId]);
    }
}

module.exports = WebSettingModel;
