const { wrapAsync } = require('../middleware/errorHandler');
const { httpError } = require('../utils/common');
const {
    getReportStats,
    getReportOverview,
    getAgentPerformance,
    getLeadInsights,
    getAllReportData
} = require('../services/report.service');

// ── GET /admin/report/stats ───────────────────────────────
const report_stats = wrapAsync(async (req, res) => {
    const { tenant_id } = req.auth;
    const data = await getReportStats(tenant_id);
    res.status(200).json({ success: true, data });
});

// ── GET /admin/report/overview ────────────────────────────
const report_overview = wrapAsync(async (req, res) => {
    const { tenant_id } = req.auth;
    const data = await getReportOverview(tenant_id);
    res.status(200).json({ success: true, data });
});

// ── GET /admin/report/agent-performance ─────────────────
const report_agent_performance = wrapAsync(async (req, res) => {
    const { tenant_id } = req.auth;
    const days = Math.min(365, Math.max(7, Number(req.query?.days) || 30));
    const data = await getAgentPerformance(tenant_id, days);
    res.status(200).json({ success: true, data });
});

// ── GET /admin/report/lead-insights ──────────────────────
const report_lead_insights = wrapAsync(async (req, res) => {
    const { tenant_id } = req.auth;
    const data = await getLeadInsights(tenant_id);
    res.status(200).json({ success: true, data });
});

// ── GET /admin/report/export?type=pdf|excel ───────────────
const report_export = wrapAsync(async (req, res) => {
    const { tenant_id } = req.auth;
    const type = String(req.query?.type || 'excel').toLowerCase();

    if (!['pdf', 'excel'].includes(type)) {
        throw httpError(400, 'type must be pdf or excel');
    }

    const { stats, overview, agentPerformance, leadInsights } = await getAllReportData(tenant_id);
    const timestamp = new Date().toISOString().split('T')[0];

    if (type === 'excel') {
        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        wb.creator = 'AlgoTwist CRM';
        wb.created = new Date();

        // ── Sheet 1: KPI Stats ──
        const statsSheet = wb.addWorksheet('KPI Stats');
        statsSheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 }
        ];
        styleHeader(statsSheet.getRow(1));
        statsSheet.addRows([
            { metric: 'Total Revenue (INR)', value: stats.total_revenue },
            { metric: 'Total Leads', value: stats.total_leads },
            { metric: 'Conversion Rate (%)', value: stats.conversion_rate },
            { metric: 'Active Inventory', value: stats.active_inventory },
            { metric: 'Avg Response Time (hrs)', value: stats.avg_response_time ?? 'N/A' },
            { metric: 'Pending Follow-ups', value: stats.pending_followups },
            { metric: 'Closed Deals', value: stats.closed_deals },
        ]);

        // ── Sheet 2: Funnel ──
        const funnelSheet = wb.addWorksheet('Conversion Funnel');
        funnelSheet.columns = [
            { header: 'Stage', key: 'stage', width: 25 },
            { header: 'Count', key: 'count', width: 15 },
            { header: 'Percentage (%)', key: 'percentage', width: 18 },
            { header: 'Drop-off (%)', key: 'drop_off', width: 18 }
        ];
        styleHeader(funnelSheet.getRow(1));
        overview.funnel.forEach(f => funnelSheet.addRow(f));

        // ── Sheet 3: Agent Performance ──
        const agentSheet = wb.addWorksheet('Agent Performance');
        agentSheet.columns = [
            { header: 'Agent Name', key: 'agent_name', width: 25 },
            { header: 'Leads Added', key: 'total_leads_added', width: 16 },
            { header: 'Leads Assigned', key: 'total_leads_assigned', width: 18 },
            { header: 'Pending Leads', key: 'pending_leads', width: 16 },
            { header: 'Deals Closed', key: 'deals_closed', width: 16 },
            { header: 'Revenue (INR)', key: 'revenue_generated', width: 20 },
            { header: 'Conversion Rate (%)', key: 'conversion_rate', width: 22 },
            { header: 'Avg Response (hrs)', key: 'avg_response_time', width: 22 },
            { header: 'Status', key: 'performance_status', width: 15 },
            { header: 'Trend', key: 'trend', width: 12 }
        ];
        styleHeader(agentSheet.getRow(1));
        agentPerformance.forEach(a => agentSheet.addRow({
            ...a,
            avg_response_time: a.avg_response_time ?? 'N/A'
        }));

        // ── Sheet 4: Lead Insights ──
        const insightSheet = wb.addWorksheet('Lead Insights');
        insightSheet.addRow(['Leads by Source']);
        styleHeader(insightSheet.getRow(insightSheet.rowCount));
        insightSheet.addRow(['Source', 'Count', 'Percentage (%)']);
        leadInsights.leads_by_source.forEach(s => insightSheet.addRow([s.source, s.count, s.percentage]));

        insightSheet.addRow([]);
        insightSheet.addRow(['Leads by Location (City)']);
        styleHeader(insightSheet.getRow(insightSheet.rowCount));
        insightSheet.addRow(['City', 'Count', 'Percentage (%)']);
        leadInsights.leads_by_location.forEach(l => insightSheet.addRow([l.city, l.count, l.percentage]));

        insightSheet.addRow([]);
        insightSheet.addRow(['Hot vs Cold Segmentation']);
        styleHeader(insightSheet.getRow(insightSheet.rowCount));
        insightSheet.addRow(['Hot (High)', leadInsights.hot_vs_cold.hot]);
        insightSheet.addRow(['Warm (Medium)', leadInsights.hot_vs_cold.warm]);
        insightSheet.addRow(['Cold (Low)', leadInsights.hot_vs_cold.cold]);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="report-${timestamp}.xlsx"`);
        await wb.xlsx.write(res);
        res.end();
        return;
    }

    // ── PDF ──
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${timestamp}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('AlgoTwist CRM — Analytics Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
        .text(`Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── Section: KPIs ──
    pdfSection(doc, 'Key Performance Indicators');
    const kpis = [
        ['Total Revenue (INR)', formatINR(stats.total_revenue)],
        ['Total Leads', stats.total_leads],
        ['Conversion Rate', `${stats.conversion_rate}%`],
        ['Active Inventory', stats.active_inventory],
        ['Avg Response Time', stats.avg_response_time ? `${stats.avg_response_time} hrs` : 'N/A'],
        ['Pending Follow-ups', stats.pending_followups],
        ['Closed Deals', stats.closed_deals],
    ];
    kpis.forEach(([label, val]) => pdfRow(doc, label, String(val)));
    doc.moveDown();

    // ── Section: Funnel ──
    pdfSection(doc, 'Conversion Funnel (Last 30 Days)');
    overview.funnel.forEach(f => {
        pdfRow(doc, f.stage, `${f.count} leads (${f.percentage}%)`);
    });
    doc.moveDown();

    // ── Section: Agent Performance ──
    pdfSection(doc, 'Agent Performance');
    if (agentPerformance.length === 0) {
        doc.font('Helvetica').fontSize(10).fillColor('#888').text('No agent data available.');
    } else {
        agentPerformance.forEach((a, i) => {
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#111')
                .text(`${i + 1}. ${a.agent_name}`);
            doc.font('Helvetica').fontSize(9).fillColor('#555')
                .text(`   Added: ${a.total_leads_added}  |  Assigned: ${a.total_leads_assigned}  |  Pending: ${a.pending_leads}  |  Deals: ${a.deals_closed}  |  Revenue: ${formatINR(a.revenue_generated)}  |  Conversion: ${a.conversion_rate}%  |  Status: ${a.performance_status}`);
            doc.moveDown(0.3);
        });
    }
    doc.moveDown();

    // ── Section: Lead Insights ──
    pdfSection(doc, 'Lead Insights');
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111').text('By Source:');
    leadInsights.leads_by_source.forEach(s =>
        doc.font('Helvetica').fontSize(9).fillColor('#444')
            .text(`  ${s.source}: ${s.count} leads (${s.percentage}%)`)
    );
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111').text('Hot vs Cold:');
    doc.font('Helvetica').fontSize(9).fillColor('#444')
        .text(`  Hot: ${leadInsights.hot_vs_cold.hot}  |  Warm: ${leadInsights.hot_vs_cold.warm}  |  Cold: ${leadInsights.hot_vs_cold.cold}`);

    doc.end();
});

// ─── PDF Helpers ─────────────────────────────────────────

function pdfSection(doc, title) {
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#1a1a1a').text(title);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.5);
}

function pdfRow(doc, label, value) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333').text(label, 50, doc.y, { continued: true, width: 250 });
    doc.font('Helvetica').fontSize(9).fillColor('#555').text(value, { align: 'right' });
}

function formatINR(value) {
    if (!value) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

// ─── Excel Helper ─────────────────────────────────────────

function styleHeader(row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
    row.height = 22;
}

module.exports = {
    report_stats,
    report_overview,
    report_agent_performance,
    report_lead_insights,
    report_export
};
