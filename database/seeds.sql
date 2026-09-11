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
(9, '505', 'Bayar Tagihan Listrik, Air & Wi-Fi', 'Pengeluaran', 'Utilitas', 'Pembayaran tagihan utilitas harian masjid', 1),
(10, '100', 'Transfer Internal / Mutasi Kas & Bank', 'Penerimaan', 'Lainnya', 'Kategori khusus untuk transaksi mutasi kas dan bank antar rekening', 1)
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

-- Master Kategori Barang & Aset (Standar COA ISAK 35)
INSERT INTO item_categories (id, account_code, name, type, description) VALUES
(1, '1210', 'Tanah & Lahan', 'Aset', 'Tanah Bangunan Masjid, Lahan Parkir, Tanah Wakaf Pemakaman'),
(2, '1220', 'Bangunan & Infrastruktur', 'Aset', 'Gedung Main Hall Sholat, Menara Masjid, Area Wudhu & Toilet, Gazebo'),
(3, '1230', 'Peralatan & Mesin', 'Aset', 'Sound System, AC Split, Projector, Genset, Jam Digital Running Text'),
(4, '1240', 'Meubiler & Mebel', 'Aset', 'Mimbar Jati, Karpet Sajadah Roll, Lemari Al-Qur\'an, Meja Rapat DKM'),
(5, '1290', 'Aset Tetap Lainnya', 'Aset', 'Aset tetap modal fisik masjid lainnya'),
(6, '5021', 'Bahan Bangunan', 'Material', 'Semen, Pasir, Besi, Cat, Keramik untuk proyek/renovasi'),
(7, '5031', 'Bahan & Alat Kebersihan', 'Material', 'Cairan pembersih lantai, sabun, kain pel, sapu, trash bag'),
(8, '5032', 'Alat Tulis Kantor (ATK)', 'Material', 'Kertas A4, pulpen, tinta printer, amplop infaq, buku kas'),
(9, '5033', 'Perlengkapan Dapur & Harian', 'Material', 'Kopi, gula, tissue, gelas plastik, gas LPG'),
(10, '5039', 'Material dan Bahan Lainnya', 'Material', 'Persediaan material operasional habis pakai lainnya')
ON DUPLICATE KEY UPDATE name=VALUES(name), type=VALUES(type), description=VALUES(description);

-- Master Katalog Barang & Material Standar
INSERT INTO master_items (id, code, name, type, unit_id, category, description) VALUES
(1, '1230-001', 'Sound System Yamaha Mixer & Speaker', 'Aset', 10, 'Peralatan & Mesin', 'Set pengeras suara utama masjid'),
(2, '1230-002', 'AC Split 2 PK Daikin', 'Aset', 1, 'Peralatan & Mesin', 'Air Conditioner ruang utama sholat'),
(3, '1230-003', 'Karpet Sajadah Roll Karaba', 'Aset', 7, 'Peralatan & Mesin', 'Karpet sajadah sholat jamaah'),
(4, '1240-001', 'Mimbar Kayu Jati Ukir', 'Aset', 1, 'Meubiler & Mebel', 'Mimbar khutbah jumat'),
(5, '5021-001', 'Semen Gresik 50kg', 'Material', 2, 'Bahan Bangunan', 'Semen Portland untuk pengecoran & dinding'),
(6, '5021-002', 'Pasir Pasang Hitam', 'Material', 1, 'Bahan Bangunan', 'Pasir cor & pasang bata'),
(7, '5021-003', 'Cat Tembok Dulux White 20L', 'Material', 5, 'Bahan Bangunan', 'Cat pelapis dinding luar/dalam'),
(8, '5031-001', 'Sabun Pembersih Karpet & Pel', 'Material', 8, 'Bahan & Alat Kebersihan', 'Pembersih lantai & karpet harian'),
(9, '5031-002', 'Alat Pel Gagang Stainless', 'Material', 1, 'Bahan & Alat Kebersihan', 'Perlengkapan alat pel masjid')
ON DUPLICATE KEY UPDATE code=VALUES(code), name=VALUES(name), category=VALUES(category);

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

-- Master Lokasi Penempatan Barang & Aset
INSERT INTO asset_locations (id, code, name, description) VALUES
(1, 'LOC-01', 'Ruang Utama Sholat', 'Area sholat utama jamaah di lantai 1'),
(2, 'LOC-02', 'Ruang DKM & Sekretariat', 'Kantor pengurus dan administrasi DKM'),
(3, 'LOC-03', 'Area Wudhu & Toilet', 'Fasilitas tempat wudhu dan toilet jamaah'),
(4, 'LOC-04', 'Gedung Pembangunan & Menara', 'Area proyek renovasi dan struktur menara'),
(5, 'LOC-05', 'Gudang Masjid', 'Tempat penyimpanan barang & perlengkapan masjid'),
(6, 'LOC-06', 'Halaman & Parkir', 'Lahan luar dan area parkir kendaraan'),
(7, 'LOC-07', 'Lantai 2 / Balkon Sholat', 'Area sholat tambahan di lantai 2'),
(8, 'LOC-08', 'Masjid Utama', 'Area lingkungan kompleks masjid')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

