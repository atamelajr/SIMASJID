const MasjidModel = require('../models/MasjidModel');

class ProfilController {
    static async index(req, res) {
        try {
            const profile = await MasjidModel.getProfile();
            const dkmMembers = await MasjidModel.getDkmMembers();

            res.render('profil/index', {
                title: 'Profil Masjid & DKM',
                profile,
                dkmMembers
            });
        } catch (err) {
            console.error('Profil Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async updateProfile(req, res) {
        try {
            await MasjidModel.updateProfile(req.body);
            res.redirect('/profil');
        } catch (err) {
            console.error('Update Profil Error:', err);
            res.redirect('/profil');
        }
    }

    static async addDkmMember(req, res) {
        try {
            const photo = req.file ? req.file.filename : null;
            await MasjidModel.addDkmMember({
                ...req.body,
                photo
            });
            res.redirect('/profil');
        } catch (err) {
            console.error('Add DKM Error:', err);
            res.redirect('/profil');
        }
    }
}

module.exports = ProfilController;
