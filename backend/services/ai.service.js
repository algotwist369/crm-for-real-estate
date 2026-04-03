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
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant for a real estate CRM. 
                    Rewrite the following lead follow-up message to make it sound more personalized, friendly, and professional. 
                    IMPORTANT: Keep all placeholders like {{name}}, {{phone}}, {{email}}, {{project_name}}, {{city}}, {{agent_name}}, {{company_name}} exactly as they are. 
                    Do not change the intent or the call to action.`
                },
                {
                    role: "user",
                    content: template
                }
            ],
            temperature: 0.7,
            max_tokens: 500
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
