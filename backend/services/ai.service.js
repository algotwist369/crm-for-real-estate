const { OpenAI } = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateVariation = async (template) => {
    if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not set, skipping AI generation');
        return template;
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert real estate outreach specialist. 
                    Your task is to rewrite the provided campaign message for better engagement.
                    
                    RULES:
                    1. Keep it CONCISE and impact-driven. Do NOT make it longer than the original.
                    2. Maintain a friendly yet professional tone.
                    3. MANDATORY: Keep all placeholders like {{name}}, {{phone}}, {{location}}, {{address}}, {{inquiry_for}}, {{agent_name}} EXACTLY as they are.
                    4. Do not change the core intent of the written message.
                    5. If a placeholder is not in the original message, do not add it.
                    6. Output ONLY the rewritten message, no preamble.`
                },
                {
                    role: "user",
                    content: template
                }
            ],
            temperature: 0.8,
            max_tokens: 300
        });

        const result = response.choices[0].message.content.trim();
        return result || template;
    } catch (error) {
        logger.error(`Error in AI generation: ${error.message}`);
        throw error;
    }
};

const generateSocialCaption = async ({
    prompt,
    tone = 'professional',
    style = 'real estate social post',
    includeHashtags = true,
    includeCta = true
}) => {
    if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not set, skipping social caption generation');
        throw new Error('OpenAI API key is not configured');
    }

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_SOCIAL_CAPTION_MODEL || 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Write concise, high-converting social captions for real estate CRM users.
Keep captions compliant, truthful, and suitable for Facebook and Instagram.
Return only the caption text.`
                },
                {
                    role: 'user',
                    content: JSON.stringify({
                        prompt,
                        tone,
                        style,
                        includeHashtags,
                        includeCta,
                        maxLength: 1800
                    })
                }
            ],
            temperature: 0.75,
            max_tokens: 500
        });

        return response.choices?.[0]?.message?.content?.trim() || '';
    } catch (error) {
        logger.error(`Social caption generation failed: ${error.message}`);
        throw error;
    }
};

module.exports = {
    generateVariation,
    generateSocialCaption
};
