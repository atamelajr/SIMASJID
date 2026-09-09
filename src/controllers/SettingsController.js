const UserModel = require('../models/UserModel');

class SettingsController {
    static async index(req, res) {
        try {
            const users = await UserModel.getAllUsers();

            res.render('settings/index', {
                title: 'Pengaturan Sistem & Pengguna',
                users
            });
        } catch (err) {
            console.error('Settings Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async createUser(req, res) {
        try {
            const { username, password, full_name, role_id, phone } = req.body;
            await UserModel.createUser({
                username,
                password,
                full_name,
                role_id: parseInt(role_id),
                phone
            });
            res.redirect('/settings');
        } catch (err) {
            console.error('Create User Error:', err);
            res.redirect('/settings');
        }
    }
}

module.exports = SettingsController;
