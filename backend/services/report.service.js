const Lead = require('../model/lead.model');
const Properties = require('../model/properties.model');
const Agent = require('../model/agent.model');
const User = require('../model/user.model');
const { parseBudget } = require('../utils/budgetParser');
const { convertCurrency } = require('../utils/currencyConverter');

// ─── helpers ────────────────────────────────────────────

function safeDiv(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return Math.round((numerator / denominator) * 1000) / 10; // one decimal %
}

function computeRevenue(leads) {
    let total = 0;
    for (const lead of leads) {
        let amount = (lead.budget_min != null && lead.budget_min > 0) ? lead.budget_min : 0;
        if (!amount) {
            const parsed = parseBudget(lead.budget || '');
            amount = parsed.min || 0;
        }
        total += convertCurrency(amount, lead.currency || '₹', 'INR');
    }
    return Math.round(total);
}

function periodBounds(days = 30) {
    const now = new Date();
    const current_start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previous_start = new Date(current_start.getTime() - days * 24 * 60 * 60 * 1000);
    return { now, current_start, previous_start };
}

// ─── 1. STATS ────────────────────────────────────────────

async function getReportStats(tenantId) {
    const base = { tenant_id: tenantId, is_active: true };

    const [
        totalLeads,
        convertedLeads,
        closedDeals,
        pendingFollowups,
        missedFollowups,
        completedFollowups,
        activeInventory,
        convertedLeadsData,
        contactedLeads,
    ] = await Promise.all([
        Lead.countDocuments(base),
        Lead.countDocuments({ ...base, status: 'converted' }),
        Lead.countDocuments({ ...base, status: { $in: ['converted', 'closed'] } }),
        Lead.countDocuments({
            ...base,
            follow_up_status: { $in: ['pending', 'rescheduled'] },
            next_follow_up_date: { $gte: new Date(new Date().setHours(0,0,0,0)) }
        }),
        Lead.countDocuments({
            ...base,
            $or: [
                { follow_up_status: 'missed' },
                { 
                    follow_up_status: { $in: ['pending', 'rescheduled'] }, 
                    next_follow_up_date: { $lt: new Date(new Date().setHours(0,0,0,0)) } 
                }
            ]
        }),
        Lead.countDocuments({ ...base, follow_up_status: 'done' }),
        Properties.countDocuments({ tenant_id: tenantId, is_active: true, property_status: 'available' }),
        Lead.find({ ...base, status: 'converted' }).select('budget currency budget_min').lean(),
        Lead.countDocuments({ ...base, status: { $in: ['contacted', 'qualified', 'follow_up', 'converted', 'closed'] } }),
    ]);

    // Avg response time: avg hours between createdAt and last_contacted_at
    const responseTimeAgg = await Lead.aggregate([
        { $match: { ...base, last_contacted_at: { $exists: true, $ne: null } } },
        {
            $project: {
                diff_hours: {
                    $divide: [
                        { $subtract: ['$last_contacted_at', '$createdAt'] },
                        1000 * 60 * 60
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                avg_hours: { $avg: '$diff_hours' }
            }
        }
    ]);

    const totalRevenue = computeRevenue(convertedLeadsData);
    const conversionRate = safeDiv(convertedLeads, totalLeads);
    const avgResponseHours = responseTimeAgg[0]?.avg_hours
        ? Math.round(responseTimeAgg[0].avg_hours * 10) / 10
        : null;

    return {
        total_revenue: totalRevenue,
        total_leads: totalLeads,
        conversion_rate: conversionRate,
        active_inventory: activeInventory,
        avg_response_time: avgResponseHours, // in hours, null if no data
        pending_followups: pendingFollowups,
        missed_followups: missedFollowups,
        completed_followups: completedFollowups,
        closed_deals: closedDeals,
        contacted_leads: contactedLeads,
        currency: 'INR'
    };
}

// ─── 2. OVERVIEW / FUNNEL ─────────────────────────────────

async function getReportOverview(tenantId) {
    const base = { tenant_id: tenantId, is_active: true };

    const [
        total,
        contacted,
        qualified,
        negotiation,
        closedOrConverted,
    ] = await Promise.all([
        Lead.countDocuments(base),
        Lead.countDocuments({ ...base, status: { $in: ['contacted', 'qualified', 'follow_up', 'converted', 'closed'] } }),
        Lead.countDocuments({ ...base, status: { $in: ['qualified', 'follow_up', 'converted', 'closed'] } }),
        Lead.countDocuments({ ...base, status: { $in: ['converted', 'closed'] } }),
        Lead.countDocuments({ ...base, status: { $in: ['converted', 'closed'] } }),
    ]);

    const funnel = [
        {
            stage: 'Total Leads',
            count: total,
            percentage: 100,
            drop_off: 0,
            color: 'zinc'
        },
        {
            stage: 'Contacted',
            count: contacted,
            percentage: safeDiv(contacted, total),
            drop_off: safeDiv(total - contacted, total),
            color: 'blue'
        },
        {
            stage: 'Qualified',
            count: qualified,
            percentage: safeDiv(qualified, total),
            drop_off: safeDiv(contacted - qualified, total),
            color: 'violet'
        },
        {
            stage: 'Negotiation',
            count: negotiation,
            percentage: safeDiv(negotiation, total),
            drop_off: safeDiv(qualified - negotiation, total),
            color: 'orange'
        },
        {
            stage: 'Closed Deals',
            count: closedOrConverted,
            percentage: safeDiv(closedOrConverted, total),
            drop_off: safeDiv(negotiation - closedOrConverted, total),
            color: 'emerald'
        },
    ];

    // Property requirement mix (by client_type)
    const clientTypeMix = await Lead.aggregate([
        { $match: base },
        { $group: { _id: '$client_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    const requirementMix = clientTypeMix.map(g => ({
        label: g._id || 'other',
        count: g.count,
        percentage: safeDiv(g.count, total)
    }));

    return { funnel, requirement_mix: requirementMix, total_leads: total };
}

// ─── 3. AGENT PERFORMANCE ─────────────────────────────────

async function getAgentPerformance(tenantId, days = 30) {
    const { now, current_start, previous_start } = periodBounds(days);

    const agents = await Agent.find({ tenant_id: tenantId, is_active: true })
        .populate('agent_details', 'user_name email profile_pic')
        .lean();

    const results = await Promise.all(agents.map(async (agent) => {
        if (!agent.agent_details) return null;
        const userId = agent.agent_details._id;

        const [
            totalLeadsAssigned,
            totalLeadsAdded,
            dealsClosed,
            convertedLeadsData,
            prevDealsClosed,
            pendingLeads,
            responseTimeAgg
        ] = await Promise.all([
            Lead.countDocuments({ tenant_id: tenantId, assigned_to: userId, is_active: true }),
            Lead.countDocuments({ tenant_id: tenantId, created_by: userId, is_active: true }),
            Lead.countDocuments({ tenant_id: tenantId, assigned_to: userId, status: { $in: ['converted', 'closed'] } }),
            Lead.find({ tenant_id: tenantId, assigned_to: userId, status: { $in: ['converted', 'closed'] } })
                .select('budget currency budget_min').lean(),
            Lead.countDocuments({
                tenant_id: tenantId,
                assigned_to: userId,
                status: { $in: ['converted', 'closed'] },
                updatedAt: { $gte: previous_start, $lt: current_start }
            }),
            Lead.countDocuments({
                tenant_id: tenantId,
                assigned_to: userId,
                status: { $in: ['new', 'contacted', 'qualified', 'follow_up'] },
                is_active: true
            }),
            Lead.aggregate([
                {
                    $match: {
                        tenant_id: tenantId,
                        assigned_to: userId,
                        last_contacted_at: { $exists: true, $ne: null }
                    }
                },
                {
                    $project: {
                        diff_hours: {
                            $divide: [
                                { $subtract: ['$last_contacted_at', '$createdAt'] },
                                1000 * 60 * 60
                            ]
                        }
                    }
                },
                { $group: { _id: null, avg: { $avg: '$diff_hours' } } }
            ])
        ]);

        const revenue = computeRevenue(convertedLeadsData);
        const conversionRate = safeDiv(dealsClosed, totalLeadsAssigned);
        const avgResponseHours = responseTimeAgg[0]?.avg
            ? Math.round(responseTimeAgg[0].avg * 10) / 10
            : null;

        // Trend: compare current deals vs previous period
        const currentDealsInPeriod = await Lead.countDocuments({
            tenant_id: tenantId,
            assigned_to: userId,
            status: { $in: ['converted', 'closed'] },
            updatedAt: { $gte: current_start, $lte: now }
        });
        const trend = currentDealsInPeriod >= prevDealsClosed ? 'up' : 'down';
        const trendPct = prevDealsClosed > 0
            ? safeDiv(Math.abs(currentDealsInPeriod - prevDealsClosed), prevDealsClosed)
            : (currentDealsInPeriod > 0 ? 100 : 0);

        let performanceStatus;
        if (conversionRate >= 30) performanceStatus = 'High';
        else if (conversionRate >= 15) performanceStatus = 'Medium';
        else performanceStatus = 'Low';

        return {
            agent_name: agent.agent_details.user_name,
            agent_email: agent.agent_details.email,
            profile_pic: agent.agent_details.profile_pic || '',
            total_leads_assigned: totalLeadsAssigned,
            total_leads_added: totalLeadsAdded,
            deals_closed: dealsClosed,
            pending_leads: pendingLeads,
            revenue_generated: revenue,
            conversion_rate: conversionRate,
            avg_response_time: avgResponseHours,
            performance_status: performanceStatus,
            trend,
            trend_pct: trendPct,
            currency: 'INR'
        };
    }));

    return results
        .filter(Boolean)
        .sort((a, b) => b.deals_closed - a.deals_closed);
}

// ─── 4. LEAD INSIGHTS ─────────────────────────────────────

async function getLeadInsights(tenantId) {
    const base = { tenant_id: tenantId, is_active: true };

    const [
        bySource,
        byLocation,
        byPriority,
        lostReasons,
        byHour,
        byDayOfWeek,
        conversionBySource,
        totalLeads
    ] = await Promise.all([
        // Leads by source
        Lead.aggregate([
            { $match: base },
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        // Leads by city
        Lead.aggregate([
            { $match: { ...base, properties: { $exists: true, $not: { $size: 0 } } } },
            {
                $lookup: {
                    from: 'properties',
                    localField: 'properties',
                    foreignField: '_id',
                    as: 'propertyDocs'
                }
            },
            { $unwind: { path: '$propertyDocs', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: '$propertyDocs.property_location.city',
                    count: { $sum: 1 }
                }
            },
            { $match: { _id: { $ne: '' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]),
        // Hot vs cold segmentation by priority
        Lead.aggregate([
            { $match: base },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        // Lost lead reasons
        Lead.aggregate([
            { $match: { ...base, status: 'lost', lost_reason: { $exists: true, $ne: '' } } },
            { $group: { _id: '$lost_reason', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]),
        // Peak hours
        Lead.aggregate([
            { $match: base },
            { $project: { hour: { $hour: '$createdAt' } } },
            { $group: { _id: '$hour', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]),
        // Peak days of week
        Lead.aggregate([
            { $match: base },
            { $project: { dayOfWeek: { $dayOfWeek: '$createdAt' } } },
            { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]),
        // Conversion rate by source
        Lead.aggregate([
            { $match: base },
            {
                $group: {
                    _id: '$source',
                    total: { $sum: 1 },
                    converted: {
                        $sum: {
                            $cond: [{ $in: ['$status', ['converted', 'closed']] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { total: -1 } }
        ]),
        Lead.countDocuments(base)
    ]);

    // Format by source
    const leadsBySource = bySource.map(g => ({
        source: g._id || 'unknown',
        count: g.count,
        percentage: safeDiv(g.count, totalLeads)
    }));

    // Format by location
    const leadsByLocation = byLocation.map(g => ({
        city: g._id || 'Unknown',
        count: g.count,
        percentage: safeDiv(g.count, totalLeads)
    }));

    // Hot/cold segmentation
    const priorityMap = {};
    byPriority.forEach(g => { priorityMap[g._id] = g.count; });
    const hotVsCold = {
        hot: priorityMap.high || 0,
        warm: priorityMap.medium || 0,
        cold: priorityMap.low || 0
    };

    // Lost reasons
    const lostLeadReasons = lostReasons.map(g => ({
        reason: g._id,
        count: g.count
    }));

    // Peak hours (0-23)
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const peakHours = byHour.map(g => ({ hour: g._id, count: g.count }));
    const peakDays = byDayOfWeek.map(g => ({
        day: DAY_NAMES[(g._id - 1) % 7] || g._id,
        count: g.count
    }));

    // Conversion by source
    const conversionPerSource = conversionBySource.map(g => ({
        source: g._id || 'unknown',
        total: g.total,
        converted: g.converted,
        conversion_rate: safeDiv(g.converted, g.total)
    }));

    return {
        total_leads: totalLeads,
        leads_by_source: leadsBySource,
        leads_by_location: leadsByLocation,
        hot_vs_cold: hotVsCold,
        lost_lead_reasons: lostLeadReasons,
        peak_hours: peakHours,
        peak_days: peakDays,
        conversion_by_source: conversionPerSource
    };
}

// ─── 5. COMBINED (for export) ─────────────────────────────

async function getAllReportData(tenantId) {
    const [stats, overview, agentPerformance, leadInsights] = await Promise.all([
        getReportStats(tenantId),
        getReportOverview(tenantId),
        getAgentPerformance(tenantId),
        getLeadInsights(tenantId)
    ]);
    return { stats, overview, agentPerformance, leadInsights };
}

module.exports = {
    getReportStats,
    getReportOverview,
    getAgentPerformance,
    getLeadInsights,
    getAllReportData
};
