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
                    3. MANDATORY: Keep all placeholders like {{name}}, {{phone}}, {{address}}, {{inquiry_for}}, {{agent_name}} EXACTLY as they are. 
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

module.exports = {
    generateVariation
};
