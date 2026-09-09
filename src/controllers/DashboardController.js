const TransactionModel = require('../models/TransactionModel');
const ProjectModel = require('../models/ProjectModel');

class DashboardController {
    static async index(req, res) {
        try {
            const summary = await TransactionModel.getDashboardSummary();
            const projects = await ProjectModel.getActiveProjects();
            
            res.render('dashboard/index', {
                title: 'Dashboard SIMASJID',
                summary,
                activeProject: projects[0] || null
            });
        } catch (err) {
            console.error('Dashboard Error:', err);
            res.render('dashboard/index', {
                title: 'Dashboard SIMASJID',
                summary: { totalSaldo: 0, totalPenerimaanBulanIni: 0, totalPengeluaranBulanIni: 0, recentLogs: [] },
                activeProject: null
            });
        }
    }
}

module.exports = DashboardController;
