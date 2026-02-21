import dotenv from 'dotenv';
dotenv.config();

export const config = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
};
