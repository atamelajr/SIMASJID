const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Persistent Session Store di MariaDB (agar session tidak hilang saat server restart)
const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000, // bersihkan session expired tiap 15 menit
    expiration: 24 * 60 * 60 * 1000, // 24 jam
    createDatabaseTable: true, // buat tabel 'sessions' di MariaDB jika belum ada
    schema: {
        tableName: 'sessions'
    }
}, pool);

// Session Middleware
app.use(session({
    key: 'simasjid_session_cookie',
    secret: process.env.SESSION_SECRET || 'simasjid_secret_key_2026',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000 // Cookie berlaku 24 jam
    }
}));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// EJS View Engine & Layouts
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layout');

// Global View Variables (Currency Formatter, User Session, Dynamic Mosque Profile)
const MasjidModel = require('./src/models/MasjidModel');
app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
    };
    res.locals.formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    try {
        const profile = await MasjidModel.getProfile();
        const dkmMembers = await MasjidModel.getDkmMembers();
        res.locals.masjidProfile = profile || { name: 'SIMASJID', address: '' };
        res.locals.dkmMembers = dkmMembers || [];
    } catch (err) {
        res.locals.masjidProfile = { name: 'SIMASJID', address: '' };
        res.locals.dkmMembers = [];
    }
    next();
});

// App Routes
app.use('/', routes);

// 404 Handler
app.use((req, res) => {
    res.status(404).render('errors/404', {
        title: '404 Halaman Tidak Ditemukan',
        layout: false
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Aplikasi SIMASJID berjalan di http://localhost:${PORT}`);
});
