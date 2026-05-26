const campaignService = require('../services/campaign.service');
const { getWhatsAppQueue } = require('../services/queue.service');
const whatsappService = require('../services/whatsapp.service');
const EmailConfig = require('../model/emailConfig.model');
const Campaign = require('../model/campaign.model');
const WhatsAppSession = require('../model/whatsappSession.model');
const logger = require('../utils/logger');
const socketService = require('../services/socket.service');
const Lead = require('../model/lead.model');
const { normalizePhone, httpError } = require('../utils/common');
const { uploadImage } = require('../utils/uploadImage');
const { getRedisConnection } = require('../services/queue.service');

const queueJobId = (...parts) => parts
    .map(part => String(part).replace(/[^a-zA-Z0-9_-]/g, '-'))
    .join('-');

const LEAD_IMPORT_TEMPLATE_HEADERS = [
    'Name',
    'Phone',
    'Type',
    'Property Type',
    'Location',
    'Inquiry For',
    'Client Type',
    'Priority',
    'Status',
    'Remarks'
];
const LEAD_IMPORT_REQUIRED_COLUMNS = new Set(['Name', 'Phone', 'Type', 'Property Type', 'Location', 'Inquiry For', 'Client Type', 'Priority', 'Status']);
const LEAD_IMPORT_ENUMS = {
    Type: ['buyer', 'seller', 'owner', 'tenant', 'investor', 'listing', 'broker', 'other'],
    'Property Type': ['villa', 'townhouse', 'apartment', 'penthouse', 'plot', 'commercial', 'office', 'shop', 'warehouse', 'other'],
    'Client Type': ['buying', 'renting', 'investing', 'selling', 'other'],
    Priority: ['low', 'medium', 'high'],
    Status: ['new', 'contacted', 'qualified', 'follow_up', 'site_visit', 'negotiation', 'booked', 'converted', 'lost', 'wasted', 'closed', 'archived']
};

function normalizeHeader(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function getCellText(cell) {
    const value = cell?.value;
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
        if (value.text !== undefined) return String(value.text).trim();
        if (value.result !== undefined) return String(value.result).trim();
        if (Array.isArray(value.richText)) return value.richText.map(item => item.text || '').join('').trim();
        if (value.hyperlink && value.text) return String(value.text).trim();
    }
    return String(value).trim();
}

function validateLeadImportHeaders(worksheet) {
    const headerRow = worksheet.getRow(1);
    const received = LEAD_IMPORT_TEMPLATE_HEADERS.map((_, index) => getCellText(headerRow.getCell(index + 1)));
    const normalizedExpected = LEAD_IMPORT_TEMPLATE_HEADERS.map(normalizeHeader);
    const normalizedReceived = received.map(normalizeHeader);
    const isExactTemplate = normalizedExpected.every((header, index) => header === normalizedReceived[index])
        && normalizedReceived.length === normalizedExpected.length;

    if (isExactTemplate) return;

    throw httpError(400, 'Excel template columns do not match. Download the latest template and keep the header row unchanged.', [
        {
            path: 'headers',
            message: `Expected: ${LEAD_IMPORT_TEMPLATE_HEADERS.join(', ')}. Received: ${received.join(', ')}`
        }
    ]);
}

function validateLeadImportRow(values, rowNumber, seenPhones) {
    const errors = [];
    LEAD_IMPORT_TEMPLATE_HEADERS.forEach(header => {
        if (LEAD_IMPORT_REQUIRED_COLUMNS.has(header) && !values[header]) {
            errors.push(`${header} is required`);
        }
    });

    const phone = normalizePhone(values.Phone);
    if (values.Phone && (!phone || phone.length < 7 || phone.length > 15)) {
        errors.push('Phone must contain 7 to 15 digits');
    }

    Object.entries(LEAD_IMPORT_ENUMS).forEach(([field, allowed]) => {
        const value = String(values[field] || '').trim().toLowerCase();
        if (value && !allowed.includes(value)) {
            errors.push(`${field} must be one of: ${allowed.join(', ')}`);
        }
    });

    if (phone && seenPhones.has(phone)) {
        errors.push('Phone is duplicated inside this Excel file');
    }
    if (phone) seenPhones.add(phone);

    return errors.length ? { row: rowNumber, errors } : null;
}

async function deleteRedisKeysByPattern(redis, pattern) {
    let cursor = '0';
    const keys = [];
    do {
        const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (Array.isArray(batch) && batch.length) keys.push(...batch);
    } while (cursor !== '0');
    if (keys.length) await redis.del(...keys);
}

async function clearLeadImportCaches(tenantId) {
    if (!tenantId) return;
    try {
        const redis = getRedisConnection();
        await Promise.all([
            deleteRedisKeysByPattern(redis, `status_groups_${tenantId}_*`),
            deleteRedisKeysByPattern(redis, `report_stats_${tenantId}`),
            deleteRedisKeysByPattern(redis, `report_overview_${tenantId}`),
            deleteRedisKeysByPattern(redis, `report_agent_perf_${tenantId}_*`),
            deleteRedisKeysByPattern(redis, `report_lead_insights_${tenantId}`)
        ]);
    } catch (error) {
        logger.warn(`Lead import cache clear failed: ${error.message}`);
    }
}

const createCampaign = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;
        const campaign = await campaignService.createCampaign(req.body, userId, tenantId);
        res.status(201).json({ success: true, campaign });
    } catch (error) {
        logger.error(`Error in createCampaign: ${error.message}`);
        next(error);
    }
};

const getCampaigns = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;
        const campaigns = await Campaign.find({ createdBy: userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, campaigns });
    } catch (error) {
        next(error);
    }
};

const getCampaignStats = async (req, res, next) => {
    try {
        const { campaignId } = req.params;
        const stats = await campaignService.getCampaignStats(campaignId);
        res.status(200).json({ success: true, stats });
    } catch (error) {
        next(error);
    }
};

const initWhatsApp = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;

        socketService.emitToUser(userId, 'whatsapp:status', {
            status: 'connecting',
            message: 'Connecting to WhatsApp...'
        });

        await getWhatsAppQueue().add('whatsapp-init', {
            type: 'INIT',
            userId,
            tenantId
        }, { jobId: queueJobId('whatsapp-init', userId, Date.now()) });

        res.status(200).json({
            success: true,
            message: 'WhatsApp initialization request queued. The QR code should appear shortly.'
        });
    } catch (error) {
        next(error);
    }
};

const regenerateWhatsAppQR = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;

        // 🚀 Senior Intent Strategy: Emit the "Connecting" toast ONLY from the controller.
        socketService.emitToUser(userId, 'whatsapp:status', {
            status: 'connecting',
            message: 'Connecting to WhatsApp...'
        });

        await getWhatsAppQueue().add('whatsapp-regenerate', {
            type: 'REGENERATE',
            userId,
            tenantId
        }, { jobId: queueJobId('whatsapp-regenerate', userId, Date.now()) });

        res.status(200).json({
            success: true,
            message: 'WhatsApp QR regeneration request queued. Please wait.'
        });
    } catch (error) {
        next(error);
    }
};

const logoutWhatsApp = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;

        // 🚀 Senior Dev Optimization: Push command to distributed queue
        await getWhatsAppQueue().add('whatsapp-logout', {
            type: 'LOGOUT',
            userId
        });

        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
};

const getWhatsAppStatus = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        let session = await WhatsAppSession.findOne({ userId });

        if (session?.status === 'qr_pending' && session.qrExpiresAt && session.qrExpiresAt < new Date()) {
            session = await WhatsAppSession.findOneAndUpdate(
                { userId },
                { status: 'disconnected', qrCode: null, qrExpiresAt: null, error: 'QR code expired' },
                { returnDocument: 'after' }
            );
        }

        if (session?.status === 'connecting' && session.updatedAt && (Date.now() - session.updatedAt.getTime()) > 2 * 60 * 1000) {
            session = await WhatsAppSession.findOneAndUpdate(
                { userId },
                { status: 'disconnected', qrCode: null, qrExpiresAt: null, error: 'Connection timed out' },
                { returnDocument: 'after' }
            );
        }

        res.status(200).json({
            success: true,
            status: session?.status || 'disconnected',
            qrCode: session?.qrCode || null,
            qrExpiresAt: session?.qrExpiresAt || null,
            error: session?.error || null,
            reconnectAttempts: session?.reconnectAttempts || 0
        });
    } catch (error) {
        next(error);
    }
};

const updateEmailConfig = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const tenantId = req.auth.tenant_id;
        const { smtp, sender, dailyLimit } = req.body;

        const config = await EmailConfig.findOneAndUpdate(
            { userId },
            {
                userId,
                tenantId,
                smtp,
                sender,
                dailyLimit,
                isActive: true
            },
            { upsert: true, returnDocument: 'after' }
        );

        res.status(200).json({ success: true, config });
    } catch (error) {
        next(error);
    }
};

const getEmailConfig = async (req, res, next) => {
    try {
        const userId = req.auth.user._id;
        const config = await EmailConfig.findOne({ userId });
        res.status(200).json({ success: true, config });
    } catch (error) {
        next(error);
    }
};

const uploadMedia = async (req, res, next) => {
    try {
        if (!req.files || !req.files.media || !req.files.media[0]) {
            return res.status(400).json({ success: false, message: 'No media file uploaded' });
        }

        const file = req.files.media[0];
        const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';

        const result = await uploadImage({
            buffer: file.buffer,
            mimeType: file.mimetype
        }, {
            folder: 'campaign_media',
            resourceType: 'auto' // Use 'auto' for both image and video
        });

        res.status(200).json({
            success: true,
            url: result.secure_url || result.url,
            mediaType: result.resource_type || resourceType
        });
    } catch (error) {
        logger.error(`Media upload failed: ${error.message}`);
        next(error);
    }
};

const downloadTemplate = async (req, res, next) => {
    try {
        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        wb.creator = 'AlgoTwist CRM';
        wb.created = new Date();

        const sheet = wb.addWorksheet('Template');

        sheet.columns = [
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Property Type', key: 'property_type', width: 18 },
            { header: 'Location', key: 'location', width: 25 },
            { header: 'Inquiry For', key: 'inquiry_for', width: 25 },
            { header: 'Client Type', key: 'client_type', width: 15 },
            { header: 'Priority', key: 'priority', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 35 }
        ];

        // Format header row (Row 1)
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
        headerRow.height = 24;
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Add 2 realistic sample rows
        sheet.addRow({
            name: 'John Doe',
            phone: '+971501234567',
            type: 'buyer',
            property_type: 'apartment',
            location: 'Downtown Dubai',
            inquiry_for: 'Burj Khalifa',
            client_type: 'buying',
            priority: 'high',
            status: 'new',
            remarks: 'Looking for a premium 2BHK apartment with Dubai Fountain view.'
        });

        sheet.addRow({
            name: 'Jane Smith',
            phone: '+971507654321',
            type: 'tenant',
            property_type: 'penthouse',
            location: 'Business Bay',
            inquiry_for: 'Downtown Views',
            client_type: 'renting',
            priority: 'medium',
            status: 'contacted',
            remarks: 'Requires fully furnished penthouse on rent.'
        });

        // Set row alignment and height for sample rows
        for (let i = 2; i <= 3; i++) {
            const row = sheet.getRow(i);
            row.height = 20;
            row.alignment = { vertical: 'middle' };
        }

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename=campaign_leads_template.xlsx');
        await wb.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

const importLeads = async (req, res, next) => {
    try {
        const ExcelJS = require('exceljs');

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
        }

        const fileName = String(req.file.originalname || '').toLowerCase();
        const mimeType = String(req.file.mimetype || '').toLowerCase();
        const allowedXlsxMimeTypes = new Set([
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/octet-stream',
            'application/zip',
            ''
        ]);
        const isXlsx = fileName.endsWith('.xlsx') && allowedXlsxMimeTypes.has(mimeType);
        if (!isXlsx) {
            return res.status(400).json({
                success: false,
                message: 'Upload the .xlsx file generated from the latest lead import template'
            });
        }

        const tenantId = req.auth.tenant_id;
        const userId = req.auth.user._id;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return res.status(400).json({ success: false, message: 'Excel worksheet is empty' });
        }

        const importedLeads = [];
        const validationErrors = [];
        const seenPhones = new Set();

        validateLeadImportHeaders(worksheet);

        // Identify cells and map
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const values = LEAD_IMPORT_TEMPLATE_HEADERS.reduce((acc, header, index) => {
                acc[header] = getCellText(row.getCell(index + 1));
                return acc;
            }, {});

            const hasAnyValue = Object.values(values).some(Boolean);
            if (!hasAnyValue) return;

            const rowError = validateLeadImportRow(values, rowNumber, seenPhones);
            if (rowError) {
                validationErrors.push(rowError);
                return;
            }

            const phone = normalizePhone(values.Phone);
            const type = values.Type.trim().toLowerCase();
            const propertyType = values['Property Type'].trim().toLowerCase();
            const clientType = values['Client Type'].trim().toLowerCase();
            const priority = values.Priority.trim().toLowerCase();
            const status = values.Status.trim().toLowerCase();

            importedLeads.push({
                name: values.Name,
                phone,
                lead_type: type,
                property_type: propertyType,
                client_type: clientType,
                location: values.Location,
                inquiry_for: values['Inquiry For'],
                requirement: values['Inquiry For'],
                priority,
                status,
                remarks: values.Remarks
            });
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Excel import validation failed. Fix the listed rows and upload again.',
                details: validationErrors.map(item => ({
                    path: `row ${item.row}`,
                    message: item.errors.join('; ')
                }))
            });
        }

        if (importedLeads.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No lead rows found in Excel file'
            });
        }

        const savedLeads = [];
        const importOrderAt = new Date();

        // Save / Upsert
        for (const leadData of importedLeads) {
            let lead = await Lead.findOne({ tenant_id: tenantId, phone: leadData.phone });

            if (lead) {
                // Update
                lead.name = leadData.name;
                lead.lead_type = leadData.lead_type;
                lead.property_type = leadData.property_type;
                lead.client_type = leadData.client_type;
                if (leadData.inquiry_for) {
                    lead.inquiry_for = leadData.inquiry_for;
                    lead.requirement = leadData.inquiry_for;
                }
                if (leadData.location) lead.location = leadData.location;
                lead.priority = leadData.priority;
                lead.status = leadData.status;
                if (leadData.remarks) lead.remarks = leadData.remarks;
                lead.is_active = true;
                lead.list_order_at = importOrderAt;
                lead.updated_by = userId;
                await lead.save();
            } else {
                // Create
                lead = new Lead({
                    ...leadData,
                    tenant_id: tenantId,
                    created_by: userId,
                    list_order_at: importOrderAt,
                    assigned_to: [userId]
                });
                await lead.save();
            }
            savedLeads.push(lead);
        }

        await clearLeadImportCaches(tenantId);

        res.status(200).json({
            success: true,
            message: `Successfully imported ${savedLeads.length} lead${savedLeads.length === 1 ? '' : 's'}`,
            count: savedLeads.length,
            data: savedLeads
        });
    } catch (error) {
        logger.error(`Lead Excel import failed: ${error.message}`);
        next(error);
    }
};

module.exports = {
    createCampaign,
    getCampaigns,
    getCampaignStats,
    initWhatsApp,
    regenerateWhatsAppQR,
    logoutWhatsApp,
    getWhatsAppStatus,
    updateEmailConfig,
    getEmailConfig,
    uploadMedia,
    downloadTemplate,
    importLeads
};
