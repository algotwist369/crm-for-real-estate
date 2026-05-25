const campaignService = require('../services/campaign.service');
const { getWhatsAppQueue } = require('../services/queue.service');
const whatsappService = require('../services/whatsapp.service');
const EmailConfig = require('../model/emailConfig.model');
const Campaign = require('../model/campaign.model');
const WhatsAppSession = require('../model/whatsappSession.model');
const logger = require('../utils/logger');
const socketService = require('../services/socket.service');
const Lead = require('../model/lead.model');
const { normalizePhone } = require('../utils/common');
const { uploadImage } = require('../utils/uploadImage');

const queueJobId = (...parts) => parts
    .map(part => String(part).replace(/[^a-zA-Z0-9_-]/g, '-'))
    .join('-');

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

        const tenantId = req.auth.tenant_id;
        const userId = req.auth.user._id;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return res.status(400).json({ success: false, message: 'Excel worksheet is empty' });
        }

        const importedLeads = [];
        const skippedRows = [];

        // Identify cells and map
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const name = String(row.getCell(1).value || '').trim();
            let rawPhone = String(row.getCell(2).value || '').trim();
            const type = String(row.getCell(3).value || 'buyer').trim().toLowerCase();
            const location = String(row.getCell(4).value || '').trim();
            const inquiry_for = String(row.getCell(5).value || '').trim();
            const client_type = String(row.getCell(6).value || 'buying').trim().toLowerCase();
            const priority = String(row.getCell(7).value || 'medium').trim().toLowerCase();
            const status = String(row.getCell(8).value || 'new').trim().toLowerCase();
            const remarks = String(row.getCell(9).value || '').trim();

            if (!name || !rawPhone) {
                skippedRows.push({ row: rowNumber, reason: 'Name or Phone is missing' });
                return;
            }

            // Normalize phone
            const phone = normalizePhone(rawPhone);
            if (!phone) {
                skippedRows.push({ row: rowNumber, reason: 'Invalid Phone number format' });
                return;
            }

            // Map and sanitize values
            const leadTypeEnum = ['buyer', 'seller', 'owner', 'tenant', 'investor', 'listing', 'broker', 'other'].includes(type) ? type : 'buyer';
            const clientTypeEnum = ['buying', 'renting', 'investing', 'selling', 'other'].includes(client_type) ? client_type : 'buying';
            const priorityEnum = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
            const statusEnum = [
                'new',
                'contacted',
                'qualified',
                'follow_up',
                'site_visit',
                'negotiation',
                'booked',
                'converted',
                'lost',
                'wasted',
                'closed',
                'archived'
            ].includes(status) ? status : 'new';

            importedLeads.push({
                name,
                phone,
                lead_type: leadTypeEnum,
                client_type: clientTypeEnum,
                location,
                inquiry_for,
                requirement: inquiry_for,
                priority: priorityEnum,
                status: statusEnum,
                remarks
            });
        });

        if (importedLeads.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid leads found in Excel file',
                skippedRows
            });
        }

        const savedLeads = [];

        // Save / Upsert
        for (const leadData of importedLeads) {
            let lead = await Lead.findOne({ tenant_id: tenantId, phone: leadData.phone });

            if (lead) {
                // Update
                lead.name = leadData.name;
                lead.lead_type = leadData.lead_type;
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
                lead.updated_by = userId;
                await lead.save();
            } else {
                // Create
                lead = new Lead({
                    ...leadData,
                    tenant_id: tenantId,
                    created_by: userId,
                    assigned_to: [userId]
                });
                await lead.save();
            }
            savedLeads.push(lead);
        }

        res.status(200).json({
            success: true,
            message: `Successfully imported ${savedLeads.length} leads`,
            count: savedLeads.length,
            data: savedLeads,
            skippedRows
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
