const db = require('../../config/database');

class MasjidModel {
    static async getProfile() {
        const [rows] = await db.query(`SELECT * FROM masjid_profile WHERE id = 1`);
        return rows[0] || {};
    }

    static async updateProfile(data) {
        const { name, address, phone, email, vision, mission, history } = data;
        await db.query(
            `UPDATE masjid_profile SET name=?, address=?, phone=?, email=?, vision=?, mission=?, history=? WHERE id=1`,
            [name, address, phone, email, vision, mission, history]
        );
    }

    static async getDkmMembers() {
        const [rows] = await db.query(`SELECT * FROM dkm_members ORDER BY display_order ASC, id ASC`);
        return rows;
    }

    static async addDkmMember({ name, position, phone, photo, display_order }) {
        await db.query(
            `INSERT INTO dkm_members (name, position, phone, photo, display_order) VALUES (?, ?, ?, ?, ?)`,
            [name, position, phone, photo || null, display_order || 0]
        );
    }
}

module.exports = MasjidModel;
