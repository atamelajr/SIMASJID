const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function backupDatabase() {
    console.log('📦 Memulai skrip Backup Database SIMASJID (ISO 27001 A.8.13)...');

    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'simasjid_db'
    };

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const dateStr = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(backupDir, `simasjid_backup_${dateStr}.sql`);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log(`✅ Terhubung ke database: ${dbConfig.database}`);

        // Dapatkan daftar tabel
        const [tables] = await connection.query('SHOW TABLES');
        const tableKey = `Tables_in_${dbConfig.database}`;

        let dumpContent = `-- SIMASJID Automated Database Backup\n`;
        dumpContent += `-- Generated: ${new Date().toLocaleString('id-ID')}\n`;
        dumpContent += `-- Database: ${dbConfig.database}\n\n`;
        dumpContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

        for (const row of tables) {
            const tableName = row[tableKey];
            if (!tableName) continue;

            // Dump CREATE TABLE
            const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createTableSql = createTableResult[0]['Create Table'];
            dumpContent += `-- Table structure for \`${tableName}\` --\n`;
            dumpContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            dumpContent += `${createTableSql};\n\n`;

            // Dump INSERT INTO data
            const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
            if (rows.length > 0) {
                dumpContent += `-- Dumping data for \`${tableName}\` --\n`;
                for (const dataRow of rows) {
                    const keys = Object.keys(dataRow).map(k => `\`${k}\``).join(', ');
                    const values = Object.values(dataRow).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        if (typeof val === 'boolean') return val ? 1 : 0;
                        return mysql.escape(val);
                    }).join(', ');
                    dumpContent += `INSERT INTO \`${tableName}\` (${keys}) VALUES (${values});\n`;
                }
                dumpContent += `\n`;
            }
        }

        dumpContent += `SET FOREIGN_KEY_CHECKS=1;\n`;

        fs.writeFileSync(backupFile, dumpContent, 'utf8');
        console.log(`🎉 Backup Database Berhasil Disimpan: ${backupFile}`);

        // Bersihkan backup tua yang berusia lebih dari 30 hari
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        files.forEach(file => {
            const filePath = path.join(backupDir, file);
            const stat = fs.statSync(filePath);
            if (now - stat.mtimeMs > thirtyDaysMs) {
                fs.unlinkSync(filePath);
                console.log(`🧹 Menghapus berkas backup tua (>30 hari): ${file}`);
            }
        });

    } catch (err) {
        console.error('❌ Gagal Melakukan Backup Database:', err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    backupDatabase();
}

module.exports = backupDatabase;
