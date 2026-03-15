let cachedTransportPromise;
const { renderTemplate, listTemplates } = require('./templates');

async function getTransport() {
    if (cachedTransportPromise) return cachedTransportPromise;
    cachedTransportPromise = (async () => {
        let nodemailer;
        try {
            nodemailer = require('nodemailer');
        } catch (e) {
            throw new Error('nodemailer is required. Run: npm install nodemailer');
        }

        const host = process.env.MAIL_HOST;
        const port = Number(process.env.MAIL_PORT || 587);
        const user = process.env.MAIL_USER;
        const pass = process.env.MAIL_PASS;
        const secure = String(process.env.MAIL_SECURE || '').toLowerCase() === 'true' || port === 465;

        if (!host || !user || !pass) {
            throw new Error('MAIL_HOST, MAIL_USER, and MAIL_PASS must be set');
        }

        return nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
            pool: true,
            maxConnections: Number(process.env.MAIL_MAX_CONNECTIONS || 5),
            maxMessages: Number(process.env.MAIL_MAX_MESSAGES || 100)
        });
    })();

    return cachedTransportPromise;
}

function normalizeAddressList(value) {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.filter(Boolean).join(', ');
    if (typeof value === 'string') return value;
    return undefined;
}

async function sendMail({
    to,
    subject,
    html,
    text,
    template,
    templateData,
    templateEnv,
    from,
    replyTo,
    cc,
    bcc,
    attachments
}) {
    if (!to) throw new Error('to is required');
    const appName = process.env.APP_NAME || 'LeadReal';
    const appUrl = process.env.APP_URL || '';
    const disabled = String(process.env.MAIL_DISABLED || '').toLowerCase() === 'true'
        || String(process.env.NODE_ENV || '').toLowerCase() === 'test';

    if (template) {
        const rendered = renderTemplate(
            template,
            templateData || {},
            { appName, appUrl, ...(templateEnv || {}) }
        );
        subject = subject || rendered.subject;
        html = html || rendered.html;
        text = text || rendered.text;
    }

    if (!subject) throw new Error('subject is required');
    if (!html && !text) throw new Error('html or text is required');

    if (disabled) {
        return {
            messageId: 'mail_disabled',
            accepted: [normalizeAddressList(to)],
            rejected: [],
            response: 'MAIL_DISABLED'
        };
    }

    const transport = await getTransport();

    const mailFrom = from || process.env.MAIL_FROM || process.env.MAIL_USER;
    if (!mailFrom) {
        throw new Error('MAIL_FROM (or MAIL_USER) must be set');
    }

    const info = await transport.sendMail({
        from: mailFrom.includes('<') ? mailFrom : `${appName} <${mailFrom}>`,
        to: normalizeAddressList(to),
        cc: normalizeAddressList(cc),
        bcc: normalizeAddressList(bcc),
        replyTo,
        subject,
        html,
        text,
        attachments
    });

    return {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response
    };
}

async function sendTemplateMail({ to, template, data, env, ...mailOptions }) {
    return sendMail({
        to,
        template,
        templateData: data,
        templateEnv: env,
        ...mailOptions
    });
}

module.exports = {
    sendMail,
    sendTemplateMail,
    listTemplates
};
