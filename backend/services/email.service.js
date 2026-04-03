const nodemailer = require('nodemailer');
const EmailConfig = require('../model/emailConfig.model');
const logger = require('../utils/logger');

const sendCampaignEmail = async (to, subject, body, userId) => {
    const config = await EmailConfig.findOne({ userId });
    if (!config || !config.isActive) {
        throw new Error('Email configuration not found or disabled');
    }

    const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
            user: config.smtp.auth.user,
            pass: config.smtp.auth.pass,
        },
    });

    try {
        await transporter.sendMail({
            from: `"${config.sender.name}" <${config.sender.email}>`,
            to,
            subject,
            html: body,
            replyTo: config.sender.replyTo || config.sender.email,
        });

        // Update daily limit and last sent
        await EmailConfig.findOneAndUpdate(
            { userId },
            { 
                $inc: { sentToday: 1 }, 
                lastSentAt: new Date() 
            }
        );

        return true;
    } catch (error) {
        logger.error(`Error sending email to ${to}: ${error.message}`);
        throw error;
    }
};

module.exports = {
    sendCampaignEmail
};
