const ProjectModel = require('../models/ProjectModel');

class ProyekController {
    static async index(req, res) {
        try {
            const { project_id } = req.query;
            const projects = await ProjectModel.getActiveProjects();
            
            let activeProject = null;
            if (project_id) {
                activeProject = projects.find(p => p.id === parseInt(project_id)) || projects[0] || null;
            } else {
                activeProject = projects[0] || null;
            }

            const progressLogs = activeProject ? await ProjectModel.getProjectLogs(activeProject.id) : [];

            res.render('proyek/index', {
                title: 'Manajemen Pembangunan Masjid',
                projects,
                activeProject,
                progressLogs,
                selectedProjectId: activeProject ? activeProject.id : ''
            });
        } catch (err) {
            console.error('Proyek Error:', err);
            res.redirect('/dashboard');
        }
    }

    static async addProgress(req, res) {
        try {
            const { project_id, log_date, percentage, description } = req.body;
            const photo = req.file ? req.file.filename : null;

            await ProjectModel.addProgressLog({
                project_id: parseInt(project_id),
                log_date,
                percentage: parseFloat(percentage),
                description,
                photo
            });

            res.redirect(`/proyek?project_id=${project_id}`);
        } catch (err) {
            console.error('Add Progress Error:', err);
            res.redirect('/proyek');
        }
    }

    static async updateProgress(req, res) {
        try {
            const { id } = req.params;
            const { project_id, log_date, percentage, description } = req.body;
            const photo = req.file ? req.file.filename : null;

            await ProjectModel.updateProgressLog(id, {
                log_date,
                percentage: parseFloat(percentage),
                description,
                photo
            });

            res.redirect(`/proyek${project_id ? '?project_id=' + project_id : ''}`);
        } catch (err) {
            console.error('Update Progress Error:', err);
            res.redirect('/proyek');
        }
    }

    static async deleteProgress(req, res) {
        try {
            const { id } = req.params;
            const { project_id } = req.query;
            await ProjectModel.deleteProgressLog(id);
            res.redirect(`/proyek${project_id ? '?project_id=' + project_id : ''}`);
        } catch (err) {
            console.error('Delete Progress Error:', err);
            res.redirect('/proyek');
        }
    }

    static async createProject(req, res) {
        try {
            const { title, target_budget, start_date, target_date, status } = req.body;
            const newId = await ProjectModel.createProject({
                title,
                target_budget: parseFloat(target_budget || 0),
                start_date,
                target_date,
                status
            });
            res.redirect(`/proyek?project_id=${newId}`);
        } catch (err) {
            console.error('Create Project Error:', err);
            res.redirect('/proyek');
        }
    }

    static async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { title, target_budget, target_date, status } = req.body;
            await ProjectModel.updateProject(id, {
                title,
                target_budget: parseFloat(target_budget || 0),
                target_date,
                status
            });
            res.redirect(`/proyek?project_id=${id}`);
        } catch (err) {
            console.error('Update Project Error:', err);
            res.redirect('/proyek');
        }
    }

    static async deleteProject(req, res) {
        try {
            const { id } = req.params;
            await ProjectModel.deleteProject(id);
            res.redirect('/proyek');
        } catch (err) {
            console.error('Delete Project Error:', err);
            res.redirect('/proyek');
        }
    }
}

module.exports = ProyekController;
