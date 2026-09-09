const db = require('../../config/database');

class ProjectModel {
    static async getActiveProjects() {
        const [projects] = await db.query(
            `SELECT p.*, 
                COALESCE((SELECT percentage FROM project_progress_logs WHERE project_id = p.id ORDER BY log_date DESC, id DESC LIMIT 1), 0) as current_percentage,
                (SELECT COUNT(*) FROM project_progress_logs WHERE project_id = p.id) as log_count
             FROM rab_projects p
             ORDER BY p.created_at DESC`
        );
        return projects;
    }

    static async getProjectLogs(projectId) {
        const [rows] = await db.query(
            `SELECT * FROM project_progress_logs WHERE project_id = ? ORDER BY log_date DESC, id DESC`,
            [projectId]
        );
        return rows;
    }

    static async addProgressLog({ project_id, log_date, percentage, description, photo }) {
        await db.query(
            `INSERT INTO project_progress_logs (project_id, log_date, percentage, description, photo)
             VALUES (?, ?, ?, ?, ?)`,
            [project_id, log_date || new Date(), percentage, description, photo || null]
        );
    }

    static async updateProgressLog(id, { log_date, percentage, description, photo }) {
        const [rows] = await db.query(`SELECT photo FROM project_progress_logs WHERE id = ?`, [id]);
        const oldPhoto = rows[0]?.photo;
        const newPhoto = photo || oldPhoto;

        await db.query(
            `UPDATE project_progress_logs 
             SET log_date = ?, percentage = ?, description = ?, photo = ?
             WHERE id = ?`,
            [log_date, percentage, description, newPhoto, id]
        );
    }

    static async deleteProgressLog(id) {
        await db.query(`DELETE FROM project_progress_logs WHERE id = ?`, [id]);
    }

    static async createProject({ title, target_budget, start_date, target_date, status }) {
        const [result] = await db.query(
            `INSERT INTO rab_projects (title, target_budget, start_date, target_date, status)
             VALUES (?, ?, ?, ?, ?)`,
            [title, target_budget, start_date || new Date(), target_date || null, status || 'Berjalan']
        );
        return result.insertId;
    }

    static async updateProject(id, { title, target_budget, target_date, status }) {
        await db.query(
            `UPDATE rab_projects 
             SET title = ?, target_budget = ?, target_date = ?, status = ?
             WHERE id = ?`,
            [title, target_budget, target_date || null, status || 'Berjalan', id]
        );
    }

    static async deleteProject(id) {
        await db.query(`DELETE FROM rab_projects WHERE id = ?`, [id]);
    }
}

module.exports = ProjectModel;
