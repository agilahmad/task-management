import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    APP_PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().default(5432),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().allow('').required(),

    JWT_SECRET: Joi.string().min(16).required(),
    JWT_EXPIRES_IN: Joi.string().default('1d'),

    AI_PROVIDER: Joi.string().valid('openai', 'gemini').default('openai'),
    AI_API_KEY: Joi.string().required(),
    AI_MODEL: Joi.string().optional(),

    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
});