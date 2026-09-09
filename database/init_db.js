const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    console.log('🔄 Memulai inisialisasi Database MariaDB...');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Terhubung ke MariaDB Server!');

        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await connection.query(schemaSql);
        console.log('✅ Tabel & Schema Database berhasil dibuat!');

        const seedsSql = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf8');
        await connection.query(seedsSql);
        console.log('✅ Data Awal (Seeds) berhasil dimasukkan!');

        await connection.end();
        console.log('🎉 Inisialisasi Database Selesai dengan Sukses!');
    } catch (err) {
        console.error('❌ Gagal Inisialisasi Database:', err.message);
        console.log('\n💡 Pastikan MariaDB Server telah diinstal dan berjalan di port 3306.');
    }
}

initDatabase();
