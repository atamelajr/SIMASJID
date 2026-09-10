const db = require("../config/database");
async function migrate() {
    try {
        console.log("Migrating transactions table for Hutang support...");
        await db.query("ALTER TABLE transactions MODIFY COLUMN payment_mode ENUM(\x27Tunai\x27, \x27Non-Tunai\x27, \x27Donasi Barang\x27, \x27Hutang\x27) NOT NULL DEFAULT \x27Tunai\x27");
        
        try {
            await db.query("ALTER TABLE transactions ADD COLUMN creditor_name VARCHAR(150) NULL AFTER donor_name");
        } catch(e) { console.log("creditor_name column info:", e.message); }

        try {
            await db.query("ALTER TABLE transactions ADD COLUMN due_date DATE NULL AFTER creditor_name");
        } catch(e) { console.log("due_date column info:", e.message); }

        try {
            await db.query("ALTER TABLE transactions ADD COLUMN debt_status ENUM(\x27Belum Lunas\x27, \x27Lunas\x27) DEFAULT \x27Lunas\x27 AFTER due_date");
        } catch(e) { console.log("debt_status column info:", e.message); }

        try {
            await db.query("ALTER TABLE transactions ADD COLUMN paid_at DATE NULL AFTER debt_status");
        } catch(e) { console.log("paid_at column info:", e.message); }

        try {
            await db.query("ALTER TABLE transactions ADD COLUMN paid_account_id INT NULL AFTER paid_at");
            await db.query("ALTER TABLE transactions ADD CONSTRAINT fk_transactions_paid_account FOREIGN KEY (paid_account_id) REFERENCES cash_accounts(id) ON DELETE SET NULL");
        } catch(e) { console.log("paid_account_id column or FK info:", e.message); }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch(err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
migrate();
