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

    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { username, password, full_name, role_id, phone, is_active } = req.body;
            await UserModel.updateUser(id, {
                username,
                password,
                full_name,
                role_id: parseInt(role_id),
                phone,
                is_active: parseInt(is_active)
            });
            res.redirect('/settings');
        } catch (err) {
            console.error('Update User Error:', err);
            res.redirect('/settings');
        }
    }

    static async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            await UserModel.toggleUserStatus(id);
            res.redirect('/settings');
        } catch (err) {
            console.error('Toggle User Status Error:', err);
            res.redirect('/settings');
        }
    }
}

module.exports = SettingsController;
