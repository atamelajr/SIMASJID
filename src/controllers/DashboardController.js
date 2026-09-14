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
                summary: { 
                    totalSaldo: 0, 
                    cashAccounts: [],
                    totalPenerimaanBulanIni: 0, 
                    totalPengeluaranBulanIni: 0, 
                    unpaidDebt: { count: 0, amount: 0 },
                    assetSummary: { totalAssets: 0, totalAssetValue: 0, totalInventoryItems: 0, totalInventoryStock: 0 },
                    recentLogs: [],
                    initialChartData: { labels: [], income: [], expense: [] }
                },
                activeProject: null
            });
        }
    }

    static async getChartData(req, res) {
        try {
            const period = req.query.period || 'monthly';
            const chartData = await TransactionModel.getChartData(period);
            res.json({ success: true, ...chartData });
        } catch (err) {
            console.error('Chart Data Error:', err);
            res.status(500).json({ success: false, message: 'Gagal mengambil data grafik' });
        }
    }
}

module.exports = DashboardController;
