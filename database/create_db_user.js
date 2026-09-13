const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createDbUser() {
    console.log('🔑 Memulai pembuatan user database non-root untuk SIMASJID...');

    const newDbUser = process.env.NEW_DB_USER || 'simasjid_user';
    const newDbPass = process.env.NEW_DB_PASSWORD || 'SimasjidSecurePass2026!';
    const dbName = process.env.DB_NAME || 'simasjid_db';

    // Koneksi awal sebagai root / user superuser saat ini
    const rootConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    let connection;
    try {
        connection = await mysql.createConnection(rootConfig);
        console.log(`✅ Terhubung ke MariaDB Server sebagai user: ${rootConfig.user}`);

        // 1. Buat database jika belum ada
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`✅ Database '${dbName}' dipastikan ada.`);

        // 2. Buat User Baru di localhost, 127.0.0.1, dan % (Docker Network Bridge)
        await connection.query(`CREATE USER IF NOT EXISTS '${newDbUser}'@'localhost' IDENTIFIED BY '${newDbPass}';`);
        await connection.query(`ALTER USER '${newDbUser}'@'localhost' IDENTIFIED BY '${newDbPass}';`);

        await connection.query(`CREATE USER IF NOT EXISTS '${newDbUser}'@'127.0.0.1' IDENTIFIED BY '${newDbPass}';`);
        await connection.query(`ALTER USER '${newDbUser}'@'127.0.0.1' IDENTIFIED BY '${newDbPass}';`);

        await connection.query(`CREATE USER IF NOT EXISTS '${newDbUser}'@'%' IDENTIFIED BY '${newDbPass}';`);
        await connection.query(`ALTER USER '${newDbUser}'@'%' IDENTIFIED BY '${newDbPass}';`);

        // 3. Berikan Hak Akses Khusus (Least-Privilege) pada simasjid_db
        await connection.query(`GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON \`${dbName}\`.* TO '${newDbUser}'@'localhost';`);
        await connection.query(`GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON \`${dbName}\`.* TO '${newDbUser}'@'127.0.0.1';`);
        await connection.query(`GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON \`${dbName}\`.* TO '${newDbUser}'@'%';`);
        await connection.query('FLUSH PRIVILEGES;');

        console.log(`🎉 User Database '${newDbUser}' berhasil dibuat dan diberi hak akses terisolasi pada '${dbName}'!`);

        // 4. Update file .env secara otomatis
        const envPath = path.join(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');

            envContent = envContent.replace(/DB_USER=.*/g, `DB_USER=${newDbUser}`);
            envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${newDbPass}`);

            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log('✅ File .env berhasil diperbarui dengan DB_USER dan DB_PASSWORD yang baru!');
        }

        await connection.end();

        // 5. Uji koneksi menggunakan user baru
        console.log(`\n🧪 Menguji koneksi dengan user baru: '${newDbUser}'...`);
        const testConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: newDbUser,
            password: newDbPass,
            database: dbName
        });

        console.log(`✅ Uji koneksi BERHASIL! Aplikasi SIMASJID kini menggunakan user database aman non-root (${newDbUser}).`);
        await testConn.end();

    } catch (err) {
        console.error('❌ Gagal membuat user database baru:', err.message);
        console.log('\n💡 Berkas query manual jika ingin membuat via MariaDB CLI / phpMyAdmin:');
        console.log(`
CREATE USER IF NOT EXISTS '${newDbUser}'@'localhost' IDENTIFIED BY '${newDbPass}';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON \`${dbName}\`.* TO '${newDbUser}'@'localhost';
FLUSH PRIVILEGES;
        `);
    }
}

createDbUser();
