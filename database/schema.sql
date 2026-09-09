-- Schema SQL SIMASJID (MariaDB / MySQL) - Sesuai Standar Akuntansi Masjid (ISAK 35)

CREATE DATABASE IF NOT EXISTS simasjid_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE simasjid_db;

-- Drop Tables in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS master_items;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS project_progress_logs;
DROP TABLE IF EXISTS rab_projects;
DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS fixed_assets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS donors_mustahik;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS cash_accounts;
DROP TABLE IF EXISTS dkm_members;
DROP TABLE IF EXISTS masjid_profile;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabel Sessions (Persistent Login Express Session)
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  expires INT(11) UNSIGNED NOT NULL,
  data MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB;

-- 2. Tabel Master Peran / Roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB;

-- 3. Tabel Pengguna / Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    phone VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Tabel Profil Masjid & DKM
CREATE TABLE masjid_profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    vision TEXT,
    mission TEXT,
    history TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE dkm_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    photo VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Tabel Rekening Kas & Bank (Multi-Fund)
CREATE TABLE cash_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(50) DEFAULT 'Kas Tunai',
    account_number VARCHAR(50) DEFAULT '-',
    account_holder VARCHAR(100) DEFAULT 'DKM Masjid',
    description TEXT,
    balance DECIMAL(15,2) DEFAULT 0.00,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Tabel Master Kategori Transaksi & Bagan Akun / Chart of Accounts (COA)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type ENUM('Penerimaan', 'Pengeluaran') NOT NULL,
    sub_type ENUM('Modal', 'Material', 'Operasional', 'ZIS', 'Wakaf', 'Donasi', 'Utilitas', 'Honor', 'Lainnya') NOT NULL DEFAULT 'Lainnya',
    description TEXT,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

-- 7. Tabel Master Satuan Barang
CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE, -- 'pcs', 'zak', 'mtr', 'kg', 'ltr', 'box'
    name VARCHAR(50) NOT NULL, -- 'Pieces', 'Zak', 'Meter', 'Kilogram', 'Liter', 'Box'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Tabel Master Katalog Barang & Material
CREATE TABLE master_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type ENUM('Aset', 'Material') NOT NULL DEFAULT 'Material', -- 'Aset' (Barang Modal) / 'Material' (Persediaan)
    unit_id INT NULL,
    category VARCHAR(50) DEFAULT 'Operasional', -- 'Pembangunan', 'Operasional', 'Peralatan', 'Lainnya'
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. Tabel Master Donatur & Mustahik
CREATE TABLE donors_mustahik (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('Donatur', 'Mustahik') NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Perorangan',
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. Tabel Mutasi Transaksi Keuangan (Buku Kas & Donasi Barang)
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_code VARCHAR(50) NOT NULL UNIQUE,
    transaction_date DATE NOT NULL,
    account_id INT NOT NULL,
    category_id INT NOT NULL,
    type ENUM('Penerimaan', 'Pengeluaran') NOT NULL,
    payment_mode ENUM('Tunai', 'Non-Tunai', 'Donasi Barang') NOT NULL DEFAULT 'Tunai', -- 'Tunai', 'Non-Tunai', 'Donasi Barang'
    is_in_kind TINYINT(1) DEFAULT 0, -- 0 = Uang (Tunai/Non-Tunai), 1 = Donasi Barang
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    donor_name VARCHAR(100) DEFAULT 'Hamba Allah',
    proof_file VARCHAR(255),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES cash_accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- 11. Tabel Inventaris Aset Tetap (Barang Modal)
CREATE TABLE fixed_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NULL,
    model_no_plate VARCHAR(100) NULL,
    purchase_date DATE,
    cost DECIMAL(15,2) DEFAULT 0.00,
    condition_status ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
    location VARCHAR(100),
    description TEXT NULL,
    transaction_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 12. Tabel Persediaan (Stok Habis Pakai / Material)
CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    category ENUM('Pembangunan', 'Operasional') NOT NULL DEFAULT 'Operasional',
    stock DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. Tabel Log Keluar/Masuk Persediaan
CREATE TABLE inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    type ENUM('Masuk', 'Keluar') NOT NULL,
    qty DECIMAL(10,2) NOT NULL,
    notes TEXT,
    transaction_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. Tabel RAB & Proyek Pembangunan
CREATE TABLE rab_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    target_budget DECIMAL(15,2) NOT NULL,
    start_date DATE,
    target_date DATE,
    status ENUM('Perencanaan', 'Berjalan', 'Selesai') DEFAULT 'Berjalan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE project_progress_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    log_date DATE NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    description TEXT,
    photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES rab_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Tabel Log Aktivitas User
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
