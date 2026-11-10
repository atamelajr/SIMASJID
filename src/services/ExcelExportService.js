let _ExcelJS = null;

function getExcelJS() {
    if (!_ExcelJS) {
        try {
            _ExcelJS = require('exceljs');
        } catch (e) {
            throw new Error("Modul 'exceljs' belum terinstall di server. Silakan jalankan 'npm install' pada server produksi Anda.");
        }
    }
    return _ExcelJS;
}

class ExcelExportService {
    /**
     * Generate styled Excel workbook for financial transactions
     * @param {Object} param0 
     * @returns {Promise<ExcelJS.Workbook>}
     */
    static async generateTransactionsExcel({ transactions, filters, filterLabels, masjidProfile, user }) {
        const ExcelJS = getExcelJS();
        const workbook = new ExcelJS.Workbook();
        workbook.creator = user?.username ? `${user.username} (SIMASJID)` : 'SIMASJID DKM';
        workbook.lastModifiedBy = user?.username || 'SIMASJID';
        workbook.created = new Date();
        workbook.modified = new Date();

        const worksheet = workbook.addWorksheet('Data Transaksi', {
            views: [{ showGridLines: true }],
            pageSetup: {
                orientation: 'landscape',
                paperSize: 9, // A4
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0
            }
        });

        // 1. Title Block
        const masjidName = (masjidProfile?.name || 'MASJID AGUNG ACEH TAMIANG').toUpperCase();
        const masjidAddress = masjidProfile?.address || '';

        // Row 1: Masjid Name
        const titleRow1 = worksheet.addRow([masjidName]);
        titleRow1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF065F46' } };
        titleRow1.alignment = { vertical: 'middle', horizontal: 'left' };
        worksheet.mergeCells('A1:Q1');
        titleRow1.height = 24;

        // Row 2: Sub-Title
        const titleRow2 = worksheet.addRow(['LAPORAN DATA TRANSAKSI KEUANGAN KAS & BANK']);
        titleRow2.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1E293B' } };
        titleRow2.alignment = { vertical: 'middle', horizontal: 'left' };
        worksheet.mergeCells('A2:Q2');
        titleRow2.height = 20;

        // Row 3: Address (if any)
        if (masjidAddress) {
            const titleRow3 = worksheet.addRow([masjidAddress]);
            titleRow3.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
            worksheet.mergeCells('A3:Q3');
            titleRow3.height = 16;
        }

        // Empty row
        worksheet.addRow([]);

        // 2. Filter Information Box
        const infoRow1 = worksheet.addRow([
            `Periode Transaksi : ${filterLabels.periodLabel || 'Semua Tanggal'}`,
            '', '', '', '', '', '', '',
            `Diexport Pada : ${filterLabels.exportDate || new Date().toLocaleString('id-ID')}`
        ]);
        infoRow1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
        worksheet.mergeCells(`A${infoRow1.number}:G${infoRow1.number}`);
        worksheet.mergeCells(`H${infoRow1.number}:Q${infoRow1.number}`);

        const infoRow2 = worksheet.addRow([
            `Filter : [Tipe: ${filterLabels.typeName}] [Kategori: ${filterLabels.categoryName}] [Bentuk: ${filterLabels.paymentModeName}] [Rekening: ${filterLabels.accountName}]`,
            '', '', '', '', '', '', '',
            `Penginput / Operator Export : ${user?.username || 'Admin'} (${user?.full_name || 'Administrator'})`
        ]);
        infoRow2.font = { name: 'Calibri', size: 9, color: { argb: 'FF475569' } };
        worksheet.mergeCells(`A${infoRow2.number}:G${infoRow2.number}`);
        worksheet.mergeCells(`H${infoRow2.number}:Q${infoRow2.number}`);

        worksheet.addRow([]); // Blank spacing

        // 3. Quick KPI Summary Cards
        let totalPenerimaanKas = 0;
        let totalPengeluaranKas = 0;
        let totalNonKas = 0;

        transactions.forEach(t => {
            const amt = parseFloat(t.amount || 0);
            if (t.is_in_kind === 1) {
                totalNonKas += amt;
            } else if (t.type === 'Penerimaan') {
                totalPenerimaanKas += amt;
            } else if (t.type === 'Pengeluaran') {
                totalPengeluaranKas += amt;
            }
        });
        const surplusDefisit = totalPenerimaanKas - totalPengeluaranKas;

        const kpiHeaderRow = worksheet.addRow([
            'TOTAL TRANSAKSI', '', 
            'PENERIMAAN KAS', '', '', 
            'PENGELUARAN KAS', '', '', 
            'SURPLUS / (DEFISIT)', '', '', 
            'DONASI BARANG (NON-KAS)', '', ''
        ]);
        const kpiValRow = worksheet.addRow([
            `${transactions.length} Data`, '', 
            totalPenerimaanKas, '', '', 
            totalPengeluaranKas, '', '', 
            surplusDefisit, '', '', 
            totalNonKas, '', ''
        ]);

        const kpiHNum = kpiHeaderRow.number;
        const kpiVNum = kpiValRow.number;

        worksheet.mergeCells(`A${kpiHNum}:B${kpiHNum}`);
        worksheet.mergeCells(`A${kpiVNum}:B${kpiVNum}`);

        worksheet.mergeCells(`C${kpiHNum}:E${kpiHNum}`);
        worksheet.mergeCells(`C${kpiVNum}:E${kpiVNum}`);

        worksheet.mergeCells(`F${kpiHNum}:H${kpiHNum}`);
        worksheet.mergeCells(`F${kpiVNum}:H${kpiVNum}`);

        worksheet.mergeCells(`I${kpiHNum}:K${kpiHNum}`);
        worksheet.mergeCells(`I${kpiVNum}:K${kpiVNum}`);

        worksheet.mergeCells(`L${kpiHNum}:N${kpiHNum}`);
        worksheet.mergeCells(`L${kpiVNum}:N${kpiVNum}`);

        kpiHeaderRow.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } };
        kpiHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
        kpiHeaderRow.height = 18;

        kpiValRow.font = { name: 'Calibri', size: 11, bold: true };
        kpiValRow.alignment = { vertical: 'middle', horizontal: 'center' };
        kpiValRow.height = 24;

        // KPI Cell Styling
        const setCardStyle = (startCol, endCol, fillRgb, fontRgb, isCurrency = true) => {
            for (let c = startCol; c <= endCol; c++) {
                const cellH = worksheet.getRow(kpiHNum).getCell(c);
                const cellV = worksheet.getRow(kpiVNum).getCell(c);
                cellH.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillRgb } };
                cellV.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillRgb } };
                cellV.font = { name: 'Calibri', size: 11, bold: true, color: { argb: fontRgb } };
                if (isCurrency) {
                    cellV.numFmt = '"Rp "#,##0;("Rp "#,##0);"-"';
                }
                cellH.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
                cellV.border = { bottom: { style: 'medium', color: { argb: fontRgb } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
            }
        };

        setCardStyle(1, 2, 'FFF8FAFC', 'FF1E293B', false); // Total
        setCardStyle(3, 5, 'FFF0FDF4', 'FF16A34A', true);  // Masuk
        setCardStyle(6, 8, 'FFFEE2E2', 'FFDC2626', true);  // Keluar
        setCardStyle(9, 11, surplusDefisit >= 0 ? 'FFFEFCE8' : 'FFFEE2E2', surplusDefisit >= 0 ? 'FFCA8A04' : 'FFDC2626', true); // Net
        setCardStyle(12, 14, 'FFFAF5FF', 'FF9333EA', true); // Donasi Barang

        worksheet.addRow([]); // Blank spacing

        // 4. Data Table Header
        const headerRow = worksheet.addRow([
            'No',
            'Kode Transaksi',
            'Tanggal',
            'Tipe',
            'Bentuk Transaksi',
            'Rekening Kas / Bank',
            'Kode COA',
            'Kategori Transaksi',
            'Sub-Tipe',
            'Pemberi / Donatur / Toko',
            'Kategori Donatur',
            'Keterangan / Keperluan',
            'Rincian Barang (Aset/Material)',
            'Penerimaan (Rp)',
            'Pengeluaran (Rp)',
            'Status Hutang',
            'Input Oleh'
        ]);
        const headerRowIndex = headerRow.number;
        headerRow.height = 26;

        headerRow.eachCell((cell) => {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } }; // Deep Emerald
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF065F46' } },
                bottom: { style: 'medium', color: { argb: 'FF065F46' } },
                left: { style: 'thin', color: { argb: 'FF065F46' } },
                right: { style: 'thin', color: { argb: 'FF065F46' } }
            };
        });

        // 5. Data Rows
        let startDataRow = headerRowIndex + 1;
        transactions.forEach((trx, idx) => {
            const rowNumber = idx + 1;
            const amt = parseFloat(trx.amount || 0);

            let penerimaan = 0;
            let pengeluaran = 0;

            if (trx.type === 'Penerimaan') {
                penerimaan = amt;
            } else if (trx.type === 'Pengeluaran') {
                pengeluaran = amt;
            } else if (trx.type === 'Mutasi') {
                // Mutasi kas antar rekening
                pengeluaran = amt;
            }

            // Detail barang aset atau inventory
            let itemDetail = '-';
            if (trx.asset_name) {
                itemDetail = `[ASET] ${trx.asset_name} (${trx.asset_qty || 1} Unit, ${trx.asset_location || 'Masjid'})`;
            } else if (trx.inventory_name) {
                itemDetail = `[MATERIAL] ${trx.inventory_name} (${trx.inventory_qty || 1} ${trx.inventory_unit || 'pcs'})`;
            }

            // Tanggal Transaksi formatted (YYYY-MM-DD)
            let dateStr = '';
            if (trx.transaction_date) {
                const d = new Date(trx.transaction_date);
                if (!isNaN(d.getTime())) {
                    dateStr = d.toISOString().split('T')[0];
                } else {
                    dateStr = String(trx.transaction_date);
                }
            }

            const row = worksheet.addRow([
                rowNumber,
                trx.transaction_code || '-',
                dateStr,
                trx.type || '-',
                trx.payment_mode || (trx.is_in_kind ? 'Donasi Barang' : 'Tunai'),
                trx.account_name || '-',
                trx.account_code || '-',
                trx.category_name || '-',
                trx.sub_type || '-',
                trx.donor_name || (trx.creditor_name ? `Supplier: ${trx.creditor_name}` : '-'),
                trx.donor_category_name || '-',
                trx.description || '-',
                itemDetail,
                penerimaan,
                pengeluaran,
                trx.payment_mode === 'Hutang' ? trx.debt_status || 'Belum Lunas' : '-',
                trx.created_by_username || trx.created_by_name || '-'
            ]);

            row.height = 20;

            // Zebra striping
            const isEven = idx % 2 === 1;
            const rowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };

                // Alignment & Formats
                if (colNumber === 1 || colNumber === 3 || colNumber === 4 || colNumber === 5 || colNumber === 7 || colNumber === 9 || colNumber === 16 || colNumber === 17) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else if (colNumber === 2) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF0F766E' } };
                } else if (colNumber === 14) {
                    // Penerimaan
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    cell.numFmt = '#,##0;(#,##0);"-"';
                    if (penerimaan > 0) {
                        cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF16A34A' } };
                    }
                } else if (colNumber === 15) {
                    // Pengeluaran
                    cell.alignment = { vertical: 'middle', horizontal: 'right' };
                    cell.numFmt = '#,##0;(#,##0);"-"';
                    if (pengeluaran > 0) {
                        cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFDC2626' } };
                    }
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                }
            });
        });

        const endDataRow = worksheet.lastRow ? worksheet.lastRow.number : headerRowIndex;

        // 6. Summary Rows at Bottom (TOTAL & SURPLUS/DEFISIT)
        if (transactions.length > 0) {
            // Row Total
            const totalRow = worksheet.addRow([]);
            totalRow.height = 24;
            const tNum = totalRow.number;

            worksheet.mergeCells(`A${tNum}:M${tNum}`);
            const labelCell = worksheet.getCell(`A${tNum}`);
            labelCell.value = 'TOTAL TRANSAKSI KEUANGAN';
            labelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
            labelCell.alignment = { vertical: 'middle', horizontal: 'right' };

            // Formulas for Penerimaan & Pengeluaran
            const sumPenerimaan = worksheet.getCell(`N${tNum}`);
            sumPenerimaan.value = { formula: `SUM(N${startDataRow}:N${endDataRow})` };
            sumPenerimaan.numFmt = '#,##0;(#,##0);"-"';
            sumPenerimaan.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF15803D' } };
            sumPenerimaan.alignment = { vertical: 'middle', horizontal: 'right' };

            const sumPengeluaran = worksheet.getCell(`O${tNum}`);
            sumPengeluaran.value = { formula: `SUM(O${startDataRow}:O${endDataRow})` };
            sumPengeluaran.numFmt = '#,##0;(#,##0);"-"';
            sumPengeluaran.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
            sumPengeluaran.alignment = { vertical: 'middle', horizontal: 'right' };

            for (let c = 1; c <= 17; c++) {
                const cell = totalRow.getCell(c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
                    bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };
            }

            // Row Surplus / Defisit
            const netRow = worksheet.addRow([]);
            netRow.height = 24;
            const nNum = netRow.number;

            worksheet.mergeCells(`A${nNum}:M${nNum}`);
            const netLabelCell = worksheet.getCell(`A${nNum}`);
            netLabelCell.value = 'SURPLUS / (DEFISIT) KAS (PENERIMAAN - PENGELUARAN)';
            netLabelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
            netLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };

            worksheet.mergeCells(`N${nNum}:O${nNum}`);
            const netValCell = worksheet.getCell(`N${nNum}`);
            netValCell.value = { formula: `N${tNum}-O${tNum}` };
            netValCell.numFmt = '"Rp "#,##0;("Rp "#,##0);"-"';
            netValCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F766E' } };
            netValCell.alignment = { vertical: 'middle', horizontal: 'right' };

            for (let c = 1; c <= 17; c++) {
                const cell = netRow.getCell(c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
                    bottom: { style: 'double', color: { argb: 'FF0F766E' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };
            }
        }

        // 7. AutoFilter & Freeze Panes
        worksheet.autoFilter = {
            from: { row: headerRowIndex, column: 1 },
            to: { row: headerRowIndex, column: 17 }
        };
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: headerRowIndex }
        ];

        // 8. Custom Column Widths
        worksheet.columns = [
            { key: 'no', width: 6 },
            { key: 'trx_code', width: 22 },
            { key: 'date', width: 14 },
            { key: 'type', width: 15 },
            { key: 'mode', width: 16 },
            { key: 'account', width: 26 },
            { key: 'coa', width: 12 },
            { key: 'category', width: 32 },
            { key: 'sub_type', width: 15 },
            { key: 'donor', width: 28 },
            { key: 'donor_cat', width: 20 },
            { key: 'desc', width: 36 },
            { key: 'item', width: 30 },
            { key: 'income', width: 20 },
            { key: 'expense', width: 20 },
            { key: 'debt', width: 15 },
            { key: 'user', width: 16 }
        ];

        return workbook;
    }
}

module.exports = ExcelExportService;
