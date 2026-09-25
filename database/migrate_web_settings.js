const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateWebSettings() {
    console.log('🔄 Memulai migrasi database Pengaturan Web (CMS SIMASJID)...');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'simasjid_db',
        multipleStatements: true
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Terhubung ke database!');

        // 1. Alter tabel masjid_profile untuk menambahkan kolom web & sosmed & SEO
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
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS friday_muadzin VARCHAR(150) DEFAULT 'Akang Abdullah'`
        ];

        for (const query of alterProfileQueries) {
            try {
                await connection.query(query);
            } catch (err) {
                // Ignore if column exists
            }
        }
        console.log('✅ Kolom masjid_profile berhasil diperbarui!');

        // 2. Tabel web_menus (Pengaturan Menu Navigasi FrontEnd)
        await connection.query(`
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
        console.log('✅ Tabel web_menus berhasil dibuat!');

        // Seed default menus jika kosong
        const [menuRows] = await connection.query(`SELECT COUNT(*) as count FROM web_menus`);
        if (menuRows[0].count === 0) {
            await connection.query(`
                INSERT INTO web_menus (title, url, target, display_order, is_active) VALUES
                ('Beranda', '/', '_self', 1, 1),
                ('Jadwal Sholat', '/jadwal-sholat', '_self', 2, 1),
                ('Transparansi Kas', '/transparansi', '_self', 3, 1),
                ('Proyek Donasi', '/proyek-donasi', '_self', 4, 1),
                ('Berita & Artikel', '/berita', '_self', 5, 1),
                ('Galeri Foto', '/galeri', '_self', 6, 1),
                ('Mode TV', '/display-tv', '_blank', 7, 1)
            `);
            console.log('✅ Default web_menus berhasil diseed!');
        }

        // 3. Tabel friday_officers (Jadwal Petugas Sholat Jumat)
        await connection.query(`
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

        // 4. Tabel web_banners & alter badge_text
        await connection.query(`
            CREATE TABLE IF NOT EXISTS web_banners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                subtitle TEXT NULL,
                image_url VARCHAR(255) NOT NULL,
                button_text VARCHAR(50) NULL,
                button_link VARCHAR(255) NULL,
                badge_text VARCHAR(50) NULL,
                display_order INT DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);
        try {
            await connection.query(`ALTER TABLE web_banners ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50) NULL`);
        } catch (err) {}
        console.log('✅ Tabel web_banners berhasil dibuat & diperbarui!');

        // 5. Tabel web_announcements
        await connection.query(`
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
        console.log('✅ Tabel web_announcements berhasil dibuat!');

        // 6. Tabel web_articles
        await connection.query(`
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
        console.log('✅ Tabel web_articles berhasil dibuat!');

        // 7. Tabel web_galleries & alter event_date
        await connection.query(`
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
        try {
            await connection.query(`ALTER TABLE web_galleries ADD COLUMN IF NOT EXISTS event_date DATE NULL`);
        } catch (err) {}
        console.log('✅ Tabel web_galleries berhasil dibuat & diperbarui!');

        // Seed data sampel jika kosong
        const [bannerRows] = await connection.query(`SELECT COUNT(*) as count FROM web_banners`);
        if (bannerRows[0].count === 0) {
            await connection.query(`
                INSERT INTO web_banners (title, subtitle, image_url, button_text, button_link, badge_text, display_order) VALUES
                ('Selamat Datang di SIMASJID', 'Pusat Kegiatan Ibadah, Dakwah, & Pembinaan Umat yang Mandiri', '/images/hero-default.jpg', 'Jadwal Sholat', '/jadwal-sholat', 'INFORMASI UTAMA', 1)
            `);
        }

        const [articleRows] = await connection.query(`SELECT COUNT(*) as count FROM web_articles`);
        if (articleRows[0].count === 0) {
            await connection.query(`
                INSERT INTO web_articles (title, slug, category, content, summary, author_name) VALUES
                ('Keutamaan Memakmurkan Masjid di Zaman Modern', 'keutamaan-memakmurkan-masjid', 'Kajian & Dakwah', '<p>Memakmurkan masjid adalah salah satu tanda keimanan seorang muslim. Masjid bukan hanya tempat sholat lima waktu, tetapi juga pusat kegiatan pembinaan generasi muda dan bakti sosial masyarakat.</p>', 'Keutamaan dan keberkahan dalam meramaikan kegiatan dan ibadah di masjid.', 'Pengurus DKM')
            `);
        }

        const [announcementRows] = await connection.query(`SELECT COUNT(*) as count FROM web_announcements`);
        if (announcementRows[0].count === 0) {
            await connection.query(
                `INSERT INTO web_announcements (title, content, type) VALUES (?, ?, ?)`,
                ['Kajian Rutin Malam Minggu', "Diundang kepada seluruh jamaah untuk menghadiri Kajian Ba'da Maghrib bersama Ustadz Drs. H. Ahmad Dahlan.", 'Kegiatan']
            );
        }

        await connection.end();
        console.log('🎉 Migrasi Pengaturan Web Selesai!');
    } catch (err) {
        console.error('❌ Gagal Migrasi:', err);
    }
}

migrateWebSettings();
