const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security HTTP Headers (ISO/IEC 27001 A.8.28 & Clickjacking Protection)
app.use(helmet({
    frameguard: { action: 'deny' }, // Clickjacking protection (X-Frame-Options: DENY)
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "https://api.aladhan.com", "https://cdn.jsdelivr.net"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: null // Mencegah browser memaksa redirect HTTP ke HTTPS jika belum ada SSL
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
}));

// Static Files (Ditempatkan sebelum Rate Limiter agar gambar, CSS, JS tidak terblokir HTTP 429)
app.use(express.static(path.join(__dirname, 'public')));

// Global Rate Limiter (ISO/IEC 27001 A.8.20 Anti-DDoS / Traffic Throttling)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 1000, // maksimal 1000 request per IP per 15 menit
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.'
});
app.use(generalLimiter);

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

// Session Middleware (Hardened Sesuai ISO/IEC 27001 A.8.5)
app.use(session({
    key: 'simasjid_session_cookie',
    secret: process.env.SESSION_SECRET || 'simasjid_secret_key_2026',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true, // Proteksi XSS (Mencegah pencurian cookie via JavaScript)
        sameSite: 'lax', // Proteksi CSRF
        secure: process.env.COOKIE_SECURE === 'true', // Hanya gunakan SSL jika diatur COOKIE_SECURE=true
        maxAge: 24 * 60 * 60 * 1000 // Cookie berlaku 24 jam
    }
}));

// EJS View Engine & Layouts
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layout');

// Global View Variables (Currency Formatter, User Session, Dynamic Mosque Profile)
const WebSettingModel = require('./src/models/WebSettingModel');
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
        const profile = await WebSettingModel.getWebProfile();
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

// Centralized 500 Error Handler (ISO 27001 - Prevent Internal Stack Trace Leakage)
app.use((err, req, res, next) => {
    console.error('❌ Internal Server Error:', err);
    if (res.headersSent) {
        return next(err);
    }
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).render('errors/500', {
        title: '500 Server Error',
        layout: false,
        message: isProduction ? 'Terjadi kesalahan pada server. Silakan hubungi pengelola.' : err.message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Aplikasi SIMASJID berjalan di http://localhost:${PORT}`);
});
