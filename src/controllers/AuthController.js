const UserModel = require('../models/UserModel');

class AuthController {
    static renderLogin(req, res) {
        if (req.session.user) {
            return res.redirect('/dashboard');
        }
        res.render('auth/login', {
            layout: false,
            error: null
        });
    }

    static async login(req, res) {
        const { username, password } = req.body;
        try {
            const user = await UserModel.findByUsername(username);
            if (!user) {
                return res.render('auth/login', {
                    layout: false,
                    error: 'Username atau password tidak ditemukan!'
                });
            }

            const isMatch = await UserModel.verifyPassword(password, user.password_hash);
            if (!isMatch) {
                return res.render('auth/login', {
                    layout: false,
                    error: 'Username atau password salah!'
                });
            }

            // Simpan Session
            req.session.user = {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role_id: user.role_id,
                role_name: user.role_name
            };

            const returnTo = req.session.returnTo || '/dashboard';
            delete req.session.returnTo;
            res.redirect(returnTo);
        } catch (err) {
            console.error('Login error:', err);
            res.render('auth/login', {
                layout: false,
                error: 'Terjadi kesalahan sistem saat login.'
            });
        }
    }

    static logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/auth/login');
        });
    }
}

module.exports = AuthController;
