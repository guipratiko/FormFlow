export default () => ({
  port: parseInt(process.env.PORT || '4341', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  publicFormBaseUrl: (process.env.PUBLIC_FORM_BASE_URL || 'https://forms.onlyflow.com.br').replace(
    /\/$/,
    ''
  ),
  jwtSecret: process.env.JWT_SECRET || '',
  onlyflowInternalKey: process.env.ONLYFLOW_INTERNAL_KEY || '',
  onlyflowBackendUrl: (process.env.ONLYFLOW_BACKEND_URL || 'http://localhost:4331').replace(/\/$/, ''),
  redisUrl: process.env.REDIS_URL || '',
});
