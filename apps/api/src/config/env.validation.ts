import * as Joi from 'joi';

function requiredString(key: string) {
  return Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': `${key} environment variable is required`,
      'string.empty': `${key} environment variable is required`,
    });
}

function requiredUrl(key: string) {
  return requiredString(key)
    .uri()
    .messages({
      'string.uri': `${key} must be a valid URL`,
    });
}

const envSchema = Joi.object({
  DATABASE_URL: requiredString('DATABASE_URL'),
  JWT_SECRET: requiredString('JWT_SECRET'),
  RESEND_API_KEY: requiredString('RESEND_API_KEY'),
  RESEND_FROM_EMAIL: requiredString('RESEND_FROM_EMAIL'),
  PORT: Joi.number().integer().min(1).max(65535).empty('').messages({
    'number.base': 'PORT must be an integer between 1 and 65535',
    'number.integer': 'PORT must be an integer between 1 and 65535',
    'number.min': 'PORT must be an integer between 1 and 65535',
    'number.max': 'PORT must be an integer between 1 and 65535',
  }),
  STORAGE_DRIVER: Joi.string().valid('local', 'r2').messages({
    'any.only': 'STORAGE_DRIVER must be either local or r2',
  }),
  REDIS_URL: Joi.string().trim().uri().optional().messages({
    'string.uri': 'REDIS_URL must be a valid URL',
  }),
  R2_ENDPOINT: Joi.when('STORAGE_DRIVER', {
    is: 'r2',
    then: requiredUrl('R2_ENDPOINT'),
    otherwise: Joi.any().optional(),
  }),
  R2_ACCESS_KEY_ID: Joi.when('STORAGE_DRIVER', {
    is: 'r2',
    then: requiredString('R2_ACCESS_KEY_ID'),
    otherwise: Joi.any().optional(),
  }),
  R2_SECRET_ACCESS_KEY: Joi.when('STORAGE_DRIVER', {
    is: 'r2',
    then: requiredString('R2_SECRET_ACCESS_KEY'),
    otherwise: Joi.any().optional(),
  }),
  R2_BUCKET: Joi.when('STORAGE_DRIVER', {
    is: 'r2',
    then: requiredString('R2_BUCKET'),
    otherwise: Joi.any().optional(),
  }),
  R2_PUBLIC_BASE_URL: Joi.when('STORAGE_DRIVER', {
    is: 'r2',
    then: requiredUrl('R2_PUBLIC_BASE_URL'),
    otherwise: Joi.any().optional(),
  }),
}).unknown(true);

export function validateEnvironment(config: Record<string, unknown>) {
  const { error } = envSchema.validate(config, {
    abortEarly: true,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(error.details[0]?.message ?? error.message);
  }

  return config;
}
