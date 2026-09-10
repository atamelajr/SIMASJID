-- Seed Data Awal SIMASJID dengan Standar Akuntansi & Master Data Parameter

USE simasjid_db;

-- Insert Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'Admin', 'Akses penuh ke seluruh sistem dan database'),
(2, 'Operator', 'Akses input penerimaan, pengeluaran, buku kas, dan inventaris'),
(3, 'Pengurus', 'Akses Read-Only untuk melihat dashboard dan mencetak laporan')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Default Admin User (Password default: admin123)
INSERT INTO users (id, username, password_hash, full_name, role_id, phone, is_active) VALUES
(1, 'admin', '$2b$10$e7K4e1aR4CqHnJ01.XlQk.M1rVf.g8P/Fh6Uu1.g3bJ5dG6k7L8m9', 'Administrator DKM', 1, '081234567890', 1),
(2, 'bendahara', '$2b$10$e7K4e1aR4CqHnJ01.XlQk.M1rVf.g8P/Fh6Uu1.g3bJ5dG6k7L8m9', 'Bendahara Masjid', 2, '081298765432', 1),
(3, 'ketua', '$2b$10$e7K4e1aR4CqHnJ01.XlQk.M1rVf.g8P/Fh6Uu1.g3bJ5dG6k7L8m9', 'Ketua DKM', 3, '081112233445', 1)
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- Profil Masjid Default
INSERT INTO masjid_profile (id, name, address, phone, email, vision, mission, history) VALUES
(1, 'Masjid Al-Ikhlas', 'Jl. Raya Masjid No. 1, Kota', '021-5551234', 'info@masjidalikhlas.org',
'Menjadi pusat peradaban Islam dan pemberdayaan umat yang sejahtera.',
'1. Menyelenggarakan ibadah yang tertib dan nyaman.\n2. Mengelola keuangan masjid secara akuntabel dan transparan.\n3. Membantu kesejahteraan masyarakat sekitar.',
'Masjid Al-Ikhlas didirikan pada tahun 2010 di atas tanah wakaf seluas 1.200 m2.')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Master Rekening Kas & Bank (Multi-Fund)
INSERT INTO cash_accounts (id, code, name, bank_name, account_number, account_holder, description, balance, is_active) VALUES
(1, 'KAS-01', 'Kas Operasional Tunai', 'Kas Tunai', '-', 'Bendahara DKM', 'Rekening kas fisik untuk kebutuhan harian & kebersihan', 5000000.00, 1),
(2, 'BANK-01', 'Rekening BSI Pembangunan', 'Bank Syariah Indonesia (BSI)', '7123456789', 'DKM Masjid Al-Ikhlas Pembangunan', 'Kas khusus penampungan donasi & material pembangunan', 25000000.00, 1),
(3, 'KAS-03', 'Kas ZIS & Sosial', 'Kas Tunai', '-', 'Amil Zakat DKM', 'Kas khusus Zakat Fitrah/Maal & santunan anak yatim', 8000000.00, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Master Kategori Transaksi & Bagan Akun / Chart of Accounts (COA)
INSERT INTO categories (id, account_code, name, type, sub_type, description, is_active) VALUES
(1, '401', 'Penerimaan Infaq / Sedekah Jumat', 'Penerimaan', 'Operasional', 'Infaq umum kotak jumat & kebersihan', 1),
(2, '402', 'Penerimaan Wakaf Tunai Pembangunan', 'Penerimaan', 'Wakaf', 'Donasi terikat untuk pembangunan masjid', 1),
(3, '403', 'Penerimaan Zakat Fitrah & Maal', 'Penerimaan', 'ZIS', 'Penerimaan Zakat dari muzakki', 1),
(4, '404', 'Penerimaan Donasi Instansi / Govt', 'Penerimaan', 'Donasi', 'Bantuan donasi dari instansi / pemerintah', 1),
(5, '501', 'Belanja Barang Modal / Aset Tetap', 'Pengeluaran', 'Modal', 'Pembelian peralatan masjid tahan lama (AC, Sound, Carpet)', 1),
(6, '502', 'Belanja Material Pembangunan', 'Pengeluaran', 'Material', 'Pembelian semen, pasir, cat, bata untuk proyek', 1),
(7, '503', 'Belanja Perlengkapan Operasional', 'Pengeluaran', 'Operasional', 'Pembelian alat kebersihan, perlengkapan kantor', 1),
(8, '504', 'Honorarium Imam / Khatib / Muadzin', 'Pengeluaran', 'Honor', 'Honor rutin petugas ibadah jumat & harian', 1),
(9, '505', 'Bayar Tagihan Listrik, Air & Wi-Fi', 'Pengeluaran', 'Utilitas', 'Pembayaran tagihan utilitas harian masjid', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Master Satuan Barang
INSERT INTO units (id, code, name) VALUES
(1, 'pcs', 'Pieces (Buah)'),
(2, 'zak', 'Zak (Semen)'),
(3, 'mtr', 'Meter'),
(4, 'kg', 'Kilogram'),
(5, 'ltr', 'Liter'),
(6, 'box', 'Box / Dus'),
(7, 'roll', 'Roll'),
(8, 'botol', 'Botol'),
(9, 'pack', 'Pack / Pak'),
(10, 'set', 'Set')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Master Katalog Barang & Material Standar
INSERT INTO master_items (id, code, name, type, unit_id, category, description) VALUES
(1, 'ITM-AST-01', 'Sound System Yamaha Mixer & Speaker', 'Aset', 10, 'Peralatan & Mesin', 'Set pengeras suara utama masjid'),
(2, 'ITM-AST-02', 'AC Split 2 PK Daikin', 'Aset', 1, 'Peralatan & Mesin', 'Air Conditioner ruang utama sholat'),
(3, 'ITM-AST-03', 'Karpet Sajadah Roll Karaba', 'Aset', 7, 'Peralatan & Mesin', 'Karpet sajadah sholat jamaah'),
(4, 'ITM-AST-04', 'Mimbar Kayu Jati Ukir', 'Aset', 1, 'Meubiler & Mebel', 'Mimbar khutbah jumat'),
(5, 'ITM-MAT-01', 'Semen Gresik 50kg', 'Material', 2, 'Bahan Bangunan', 'Semen Portland untuk pengecoran & dinding'),
(6, 'ITM-MAT-02', 'Pasir Pasang Hitam', 'Material', 1, 'Bahan Bangunan', 'Pasir cor & pasang bata'),
(7, 'ITM-MAT-03', 'Cat Tembok Dulux White 20L', 'Material', 5, 'Bahan Bangunan', 'Cat pelapis dinding luar/dalam'),
(8, 'ITM-MAT-04', 'Sabun Pembersih Karpet & Pel', 'Material', 8, 'Bahan & Alat Kebersihan', 'Pembersih lantai & karpet harian'),
(9, 'ITM-MAT-05', 'Alat Pel Gagang Stainless', 'Material', 1, 'Bahan & Alat Kebersihan', 'Perlengkapan alat pel masjid')
ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category);

-- Master Donatur & Mustahik
INSERT INTO donors_mustahik (id, type, name, category, phone, address) VALUES
(1, 'Donatur', 'H. Ahmad Subarkah', 'Perorangan', '08123456789', 'Jl. Merdeka No. 10'),
(2, 'Donatur', 'PT Amanah Sejahtera', 'Instansi', '021-998877', 'Kawasan Industri Block C'),
(3, 'Mustahik', 'Bpk. Karso', 'Fakir', '0856112233', 'RT 02 / RW 01 Kp. Masjid'),
(4, 'Mustahik', 'Ibu Aminah', 'Miskin', '0857114455', 'RT 04 / RW 01 Kp. Masjid')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Project RAB Awal
INSERT INTO rab_projects (id, title, target_budget, start_date, target_date, status) VALUES
(1, 'Renovasi & Pembangunan Menara Masjid', 150000000.00, '2026-01-01', '2026-12-31', 'Berjalan')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Log Progres Awal
INSERT INTO project_progress_logs (id, project_id, log_date, percentage, description) VALUES
(1, 1, '2026-02-15', 25.00, 'Pengecoran pondasi dasar menara masjid selesai.'),
(2, 1, '2026-03-01', 40.00, 'Pemasangan besi ulir & struktur utama lantai 1 menara.')
ON DUPLICATE KEY UPDATE percentage=VALUES(percentage);
