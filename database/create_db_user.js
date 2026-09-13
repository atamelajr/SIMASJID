const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createDbUser() {
    console.log('🔑 Memulai pembuatan user database non-root untuk SIMASJID...');

    const newDbUser = process.env.NEW_DB_USER || 'simasjid_user';
    const newDbPass = process.env.NEW_DB_PASSWORD || 'SimasjidSecurePass2026!';
    const dbName = process.env.DB_NAME || 'simasjid_db';

    // Selalu gunakan root untuk inisialisasi awal (bukan DB_USER dari .env yang sudah diubah)
    const rootUser = process.env.ROOT_DB_USER || 'root';
    const rootPass = process.env.ROOT_DB_PASSWORD || (process.env.DB_USER === 'root' ? process.env.DB_PASSWORD : '');

    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '3306');

    let connection;
    try {
        try {
            connection = await mysql.createConnection({
                host,
                port,
                user: rootUser,
                password: rootPass,
                multipleStatements: true
            });
            console.log(`✅ Terhubung ke MariaDB Server sebagai user: ${rootUser}`);
        } catch (errRoot) {
            // Fallback koneksi root tanpa password
            connection = await mysql.createConnection({
                host,
                port,
                user: 'root',
                password: '',
                multipleStatements: true
            });
            console.log(`✅ Terhubung ke MariaDB Server sebagai user: root (default)`);
        }

        // 1. Buat database jika belum ada
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`✅ Database '${dbName}' dipastikan ada.`);

        // 2. Buat User Baru di localhost, 127.0.0.1, %, dan Docker Network
        const userHosts = ['localhost', '127.0.0.1', '%'];
        for (const h of userHosts) {
            await connection.query(`CREATE USER IF NOT EXISTS '${newDbUser}'@'${h}' IDENTIFIED BY '${newDbPass}';`);
            await connection.query(`ALTER USER '${newDbUser}'@'${h}' IDENTIFIED BY '${newDbPass}';`);
            await connection.query(`GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON \`${dbName}\`.* TO '${newDbUser}'@'${h}';`);
        }
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
            host,
            port,
            user: newDbUser,
            password: newDbPass,
            database: dbName
        });

        console.log(`✅ Uji koneksi BERHASIL! Aplikasi SIMASJID kini menggunakan user database aman non-root (${newDbUser}).`);
        await testConn.end();

    } catch (err) {
        console.error('❌ Gagal membuat user database via koneksi langsung:', err.message);

        // Fallback: Cobalah eksekusi via Docker CLI jika Docker terdeteksi
        try {
            console.log('🔄 Mencoba eksekusi pembuat user via Docker Container...');
            const containerIdOutput = execSync('docker ps -q').toString().trim();
            const containerId = containerIdOutput.split('\n')[0];
            if (containerId) {
                const sqlScript = `CREATE DATABASE IF NOT EXISTS \\\`${dbName}\\\`; CREATE USER IF NOT EXISTS '${newDbUser}'@'%' IDENTIFIED BY '${newDbPass}'; ALTER USER '${newDbUser}'@'%' IDENTIFIED BY '${newDbPass}'; GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON \\\`${dbName}\\\`.* TO '${newDbUser}'@'%'; FLUSH PRIVILEGES;`;
                execSync(`docker exec ${containerId} mariadb -u root -e "${sqlScript}" || docker exec ${containerId} mysql -u root -e "${sqlScript}"`);
                console.log(`🎉 Berhasil membuat user '${newDbUser}' di dalam Docker Container!`);

                const envPath = path.join(__dirname, '../.env');
                if (fs.existsSync(envPath)) {
                    let envContent = fs.readFileSync(envPath, 'utf8');
                    envContent = envContent.replace(/DB_USER=.*/g, `DB_USER=${newDbUser}`);
                    envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${newDbPass}`);
                    fs.writeFileSync(envPath, envContent, 'utf8');
                    console.log('✅ File .env diperbarui.');
                }
            } else {
                throw new Error('Tidak ada container Docker yang aktif.');
            }
        } catch (dockerErr) {
            console.error('❌ Gagal via Docker:', dockerErr.message);
        }
    }
}

createDbUser();
