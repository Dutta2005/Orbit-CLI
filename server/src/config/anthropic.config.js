import dotenv from 'dotenv';
dotenv.config();

export const config = {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
};
