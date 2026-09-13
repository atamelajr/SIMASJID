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

        // 1. Alter tabel masjid_profile untuk menambahkan kolom web & sosmed
        const alterProfileQueries = [
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS logo VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS favicon VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_facebook VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_youtube VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS social_whatsapp VARCHAR(50) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS hero_title VARCHAR(255) NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS hero_subtitle TEXT NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS maps_embed TEXT NULL`,
            `ALTER TABLE masjid_profile ADD COLUMN IF NOT EXISTS running_text TEXT NULL`
        ];

        for (const query of alterProfileQueries) {
            try {
                await connection.query(query);
            } catch (err) {
                // Ignore if column exists
            }
        }
        console.log('✅ Kolom masjid_profile berhasil diperbarui!');

        // 2. Tabel web_banners
        await connection.query(`
            CREATE TABLE IF NOT EXISTS web_banners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                subtitle TEXT NULL,
                image_url VARCHAR(255) NOT NULL,
                button_text VARCHAR(50) NULL,
                button_link VARCHAR(255) NULL,
                display_order INT DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);
        console.log('✅ Tabel web_banners berhasil dibuat!');

        // 3. Tabel web_announcements
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

        // 4. Tabel web_articles
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

        // 5. Tabel web_galleries
        await connection.query(`
            CREATE TABLE IF NOT EXISTS web_galleries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                category VARCHAR(50) DEFAULT 'Kegiatan',
                image_url VARCHAR(255) NOT NULL,
                description TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);
        console.log('✅ Tabel web_galleries berhasil dibuat!');

        // Seed data sampel jika kosong
        const [bannerRows] = await connection.query(`SELECT COUNT(*) as count FROM web_banners`);
        if (bannerRows[0].count === 0) {
            await connection.query(`
                INSERT INTO web_banners (title, subtitle, image_url, button_text, button_link, display_order) VALUES
                ('Selamat Datang di SIMASJID', 'Pusat Kegiatan Ibadah, Dakwah, & Pembinaan Umat yang Mandiri', '/images/hero-default.jpg', 'Jadwal Sholat', '/jadwal-sholat', 1)
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
            await connection.query(`
                INSERT INTO web_announcements (title, content, type) VALUES
                ('Kajian Rutin Malam Minggu', 'Diundang kepada seluruh jamaah untuk menghadiri Kajian Ba\'da Maghrib bersama Ustadz Drs. H. Ahmad Dahlan.', 'Kegiatan')
            `);
        }

        await connection.end();
        console.log('🎉 Migrasi Pengaturan Web Selesai!');
    } catch (err) {
        console.error('❌ Gagal Migrasi:', err);
    }
}

migrateWebSettings();
